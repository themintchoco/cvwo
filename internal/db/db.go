package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/stephenafamo/bob"
	"github.com/stephenafamo/bob/dialect/mysql"
	"github.com/stephenafamo/bob/dialect/mysql/dialect"
	"github.com/stephenafamo/bob/dialect/mysql/dm"
	"github.com/stephenafamo/bob/dialect/mysql/im"
	"github.com/stephenafamo/bob/dialect/mysql/sm"
	"github.com/stephenafamo/bob/dialect/mysql/um"
	"github.com/themintchoco/cvwo/internal/api"
	"golang.org/x/crypto/bcrypt"
)

var (
	db                  bob.DB
	dbCtx               = context.Background()
	ErrPasswordMismatch = errors.New("password does not match")
	ErrNotFound         = errors.New("not found")
)

func queryMany[T any](q bob.Query, item *T, scan ...any) (items []T, err error) {
	query, args, err := bob.Build(q)

	if err != nil {
		return
	}

	rows, err := db.QueryContext(dbCtx, query, args...)

	if err != nil {
		return
	}

	defer rows.Close()

	for rows.Next() {
		err = rows.Scan(scan...)

		if err != nil {
			return
		}

		items = append(items, *item)
	}

	if len(items) == 0 {
		items = make([]T, 0)
	}

	return
}

func queryOne(q bob.Query, scan ...any) (err error) {
	query, args, err := bob.Build(q)

	if err != nil {
		return
	}

	rows, err := db.QueryContext(dbCtx, query, args...)

	if err != nil {
		return
	}

	defer rows.Close()

	if !rows.Next() {
		err = ErrNotFound
		return
	}

	err = rows.Scan(scan...)

	return
}

func queryExec(q bob.Query) (res sql.Result, err error) {
	query, args, err := bob.Build(q)

	if err != nil {
		return
	}

	res, err = db.ExecContext(dbCtx, query, args...)

	return
}

func Connect() (err error) {
	host := os.Getenv("DB_HOST")
	database := os.Getenv("DB_DATABASE")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")

	sqlDb, err := sql.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s)/%s?parseTime=true", user, password, host, database))

	if err != nil {
		return
	}

	err = sqlDb.Ping()

	if err != nil {
		return
	}

	sqlDb.SetConnMaxLifetime(time.Minute * 3)
	sqlDb.SetMaxOpenConns(10)
	sqlDb.SetMaxIdleConns(10)

	db = bob.NewDB(sqlDb)

	return
}

func CreateUser(username, password, role string) (userID int64, err error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	if err != nil {
		return
	}

	res, err := queryExec(
		mysql.Insert(
			im.Into("users", "username", "password", "role"),
			im.Values(mysql.Arg(username, string(hashed), role)),
		),
	)

	if err != nil {
		return
	}

	userID, err = res.LastInsertId()

	return
}

func GetUser(userID int64) (user api.User, err error) {
	err = queryOne(
		mysql.Select(
			sm.Columns(
				mysql.Quote("u", "id"),
				mysql.Quote("u", "username"),
				mysql.Quote("u", "role"),
				mysql.Quote("u", "bio"),
				mysql.Quote("u", "avatar"),
				mysql.F("COUNT", "DISTINCT p.id"),
				mysql.F("COUNT", "DISTINCT c.id"),
				mysql.Quote("u", "created_at"),
				mysql.Quote("u", "deleted_at").IsNotNull()),
			sm.From("users").As("u"),
			sm.LeftJoin("posts").As("p").On(mysql.And(
				mysql.Quote("p", "user_id").EQ(mysql.Quote("u", "id")),
				mysql.Quote("p", "deleted_at").IsNull())),
			sm.LeftJoin("comments").As("c").On(mysql.And(
				mysql.Quote("c", "user_id").EQ(mysql.Quote("u", "id")),
				mysql.Quote("c", "deleted_at").IsNull())),
			sm.Where(
				mysql.Quote("u", "id").EQ(mysql.Arg(userID))),
			sm.GroupBy(mysql.Quote("u", "id"))),
		&user.ID, &user.Username, &user.Role, &user.Bio, &user.Avatar, &user.PostCount, &user.CommentCount, &user.CreatedAt, &user.Deleted,
	)

	return
}

func UpdateUser(userID int64, username, password, role, bio *string) (err error) {
	updateArgs := []bob.Mod[*dialect.UpdateQuery]{um.Table("users")}

	if username != nil {
		updateArgs = append(updateArgs, um.SetCol("username").ToArg(username))
	}

	if password != nil {
		hashed, err := bcrypt.GenerateFromPassword([]byte(*password), bcrypt.DefaultCost)

		if err != nil {
			return err
		}

		updateArgs = append(updateArgs, um.SetCol("password").ToArg(string(hashed)))
	}

	if role != nil {
		updateArgs = append(updateArgs, um.SetCol("role").ToArg(role))
	}

	if bio != nil {
		updateArgs = append(updateArgs, um.SetCol("bio").ToArg(bio))
	}

	updateArgs = append(updateArgs, um.Where(mysql.Quote("id").EQ(mysql.Arg(userID))))

	_, err = queryExec(
		mysql.Update(updateArgs...),
	)

	return
}

func UpdateUserAvatar(userID int64, avatar *string) (err error) {
	_, err = queryExec(
		mysql.Update(
			um.Table("users"),
			um.SetCol("avatar").ToArg(avatar),
			um.Where(mysql.Quote("id").EQ(mysql.Arg(userID)))),
	)

	return
}

func DeleteUser(userID int64) (err error) {
	_, err = queryExec(
		mysql.Update(
			um.Table("users"),
			um.SetCol("deleted_at").To(mysql.F("NOW")),
			um.Where(mysql.Quote("id").EQ(mysql.Arg(userID)))),
	)

	return
}

func AuthenticateUser(username, password string) (userID int64, err error) {
	var passwordHash string

	err = queryOne(
		mysql.Select(
			sm.Columns("id", "password"),
			sm.From("users"),
			sm.Where(mysql.And(
				mysql.Quote("username").EQ(mysql.Arg(username)),
				mysql.Quote("deleted_at").IsNull()))),
		&userID, &passwordHash,
	)

	if err == ErrNotFound {
		err = ErrPasswordMismatch
		return
	}

	if err != nil {
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password))

	if err == bcrypt.ErrMismatchedHashAndPassword {
		err = ErrPasswordMismatch
	}

	return
}

func GetUsernameAvailability(username string) (available bool, err error) {
	var count int

	err = queryOne(
		mysql.Select(
			sm.Columns(mysql.F("COUNT", 1)),
			sm.From("users"),
			sm.Where(mysql.Quote("username").EQ(mysql.Arg(username)))),
		&count,
	)

	if err != nil {
		return
	}

	available = count == 0

	return
}

func GetUserPreferences(userID int64) (preferences any, err error) {
	err = queryOne(
		mysql.Select(
			sm.Columns(mysql.Quote("prefs")),
			sm.From("users"),
			sm.Where(mysql.Quote("id").EQ(mysql.Arg(userID)))),
		&preferences,
	)

	if err != nil {
		return
	}

	err = json.Unmarshal(preferences.([]byte), &preferences)

	return
}

func UpdateUserPreferences(userID int64, key string, value any) (err error) {
	_, err = queryExec(
		mysql.Update(
			um.Table("users"),
			um.SetCol("prefs").To(mysql.F("JSON_SET", mysql.Quote("prefs"), mysql.Arg("$."+key), mysql.Arg(value))),
			um.Where(mysql.Quote("id").EQ(mysql.Arg(userID)))),
	)

	return
}

func CreatePost(userID int64, title, body string) (postID int64, err error) {
	res, err := queryExec(
		mysql.Insert(
			im.Into("posts", "title", "body", "user_id"),
			im.Values(mysql.Arg(title, body, userID)),
		),
	)

	if err != nil {
		return
	}

	postID, err = res.LastInsertId()

	return
}

func GetPosts(limit, offset int64, filters []bob.Expression, sortBy any) (posts []api.Post, err error) {
	var post api.Post

	posts, err = queryMany(
		mysql.Select(
			sm.Columns(
				mysql.Quote("p", "id"),
				mysql.Quote("p", "title"),
				mysql.Quote("p", "body"),
				mysql.Quote("u", "id"),
				mysql.Quote("u", "username"),
				mysql.Quote("u", "role"),
				mysql.Quote("u", "bio"),
				mysql.Quote("u", "avatar"),
				mysql.Quote("u", "created_at"),
				mysql.Quote("u", "deleted_at").IsNotNull(),
				mysql.F("COUNT", "DISTINCT c.id"),
				mysql.F("COALESCE", mysql.F("GROUP_CONCAT", "DISTINCT t.id"), mysql.S("")),
				mysql.Quote("p", "created_at"),
				mysql.Quote("p", "updated_at"),
				mysql.Quote("p", "deleted_at").IsNotNull()),
			sm.From("posts").As("p"),
			sm.InnerJoin("users").As("u").OnEQ(mysql.Quote("u", "id"), mysql.Quote("p", "user_id")),
			sm.LeftJoin("comments").As("c").OnEQ(mysql.Quote("c", "post_id"), mysql.Quote("p", "id")),
			sm.LeftJoin("post_tags").As("pt").OnEQ(mysql.Quote("pt", "post_id"), mysql.Quote("p", "id")),
			sm.LeftJoin("tags").As("t").OnEQ(mysql.Quote("t", "id"), mysql.Quote("pt", "tag_id")),
			sm.LeftJoin("post_reactions").As("pr").OnEQ(mysql.Quote("pr", "post_id"), mysql.Quote("p", "id")),
			sm.Where(mysql.And(
				append(filters, mysql.Quote("c", "deleted_at").IsNull())...)),
			sm.GroupBy(mysql.Quote("p", "id")),
			sm.OrderBy(sortBy).Desc(),
			sm.OrderBy(mysql.Quote("p", "id")).Asc(),
			sm.Limit(limit),
			sm.Offset(offset)),
		&post, &post.ID, &post.Title, &post.Body, &post.Author.ID, &post.Author.Username, &post.Author.Role, &post.Author.Bio, &post.Author.Avatar, &post.Author.CreatedAt, &post.Author.Deleted, &post.CommentCount, &post.Tags, &post.CreatedAt, &post.UpdatedAt, &post.Deleted,
	)

	return
}

func GetPost(postID int64) (post api.Post, err error) {
	err = queryOne(
		mysql.Select(
			sm.Columns(
				mysql.Quote("p", "id"),
				mysql.Quote("p", "title"),
				mysql.Quote("p", "body"),
				mysql.Quote("u", "id"),
				mysql.Quote("u", "username"),
				mysql.Quote("u", "role"),
				mysql.Quote("u", "bio"),
				mysql.Quote("u", "avatar"),
				mysql.Quote("u", "created_at"),
				mysql.Quote("u", "deleted_at").IsNotNull(),
				mysql.F("COUNT", "DISTINCT c.id"),
				mysql.F("COALESCE", mysql.F("GROUP_CONCAT", "DISTINCT t.id"), mysql.S("")),
				mysql.Quote("p", "created_at"),
				mysql.Quote("p", "updated_at"),
				mysql.Quote("p", "deleted_at").IsNotNull()),
			sm.From("posts").As("p"),
			sm.InnerJoin("users").As("u").OnEQ(mysql.Quote("u", "id"), mysql.Quote("p", "user_id")),
			sm.LeftJoin("comments").As("c").OnEQ(mysql.Quote("c", "post_id"), mysql.Quote("p", "id")),
			sm.LeftJoin("post_tags").As("pt").OnEQ(mysql.Quote("pt", "post_id"), mysql.Quote("p", "id")),
			sm.LeftJoin("tags").As("t").OnEQ(mysql.Quote("t", "id"), mysql.Quote("pt", "tag_id")),
			sm.Where(mysql.Quote("p", "id").EQ(mysql.Arg(postID))),
			sm.GroupBy(mysql.Quote("p", "id"))),
		&post.ID, &post.Title, &post.Body, &post.Author.ID, &post.Author.Username, &post.Author.Role, &post.Author.Bio, &post.Author.Avatar, &post.Author.CreatedAt, &post.Author.Deleted, &post.CommentCount, &post.Tags, &post.CreatedAt, &post.UpdatedAt, &post.Deleted,
	)

	return
}

func UpdatePost(postID int64, title, body string) (err error) {
	_, err = queryExec(
		mysql.Update(
			um.Table("posts"),
			um.SetCol("title").ToArg(title),
			um.SetCol("body").ToArg(body),
			um.Where(mysql.And(
				mysql.Quote("id").EQ(mysql.Arg(postID)),
				mysql.Quote("deleted_at").IsNull())),
		),
	)

	return
}

func DeletePost(postID int64) (err error) {
	_, err = queryExec(
		mysql.Update(
			um.Table("posts"),
			um.SetCol("deleted_at").To(mysql.F("NOW")),
			um.Where(mysql.And(
				mysql.Quote("id").EQ(mysql.Arg(postID)),
				mysql.Quote("deleted_at").IsNull())),
		),
	)

	return
}

func CreatePostReaction(userID, postID int64, reaction string) (err error) {
	_, err = queryExec(
		mysql.Insert(
			im.Into("post_reactions", "user_id", "post_id", "reaction_id"),
			im.Query(mysql.Select(
				sm.Columns(mysql.Arg(userID), mysql.Arg(postID), "id"),
				sm.From("reactions"),
				sm.Where(mysql.And(
					mysql.Quote("name").EQ(mysql.Arg(reaction)),
					mysql.Quote("type").EQ(mysql.Arg("post")))),
			)),
			im.OnDuplicateKeyUpdate(
				im.UpdateCol("reaction_id").To("id"),
			),
		),
	)

	return
}

func GetPostReactions(postID int64) (reactions []api.Reaction, err error) {
	var reaction api.Reaction

	reactions, err = queryMany(
		mysql.Select(
			sm.Columns(
				mysql.Quote("r", "id"),
				mysql.Quote("r", "name"),
				mysql.F("COUNT", mysql.Quote("r", "id"))),
			sm.From("post_reactions").As("pr"),
			sm.InnerJoin("reactions").As("r").OnEQ(mysql.Quote("r", "id"), mysql.Quote("pr", "reaction_id")),
			sm.Where(mysql.Quote("pr", "post_id").EQ(mysql.Arg(postID))),
			sm.GroupBy(mysql.Quote("r", "id"))),
		&reaction, &reaction.ID, &reaction.Name, &reaction.Count,
	)

	return
}

func GetPostReaction(userID, postID int64) (reaction api.Reaction, err error) {
	err = queryOne(
		mysql.Select(
			sm.Columns(
				mysql.Quote("r", "id"),
				mysql.Quote("r", "name"),
				"1"),
			sm.From("post_reactions").As("pr"),
			sm.InnerJoin("reactions").As("r").OnEQ(mysql.Quote("r", "id"), mysql.Quote("pr", "reaction_id")),
			sm.Where(mysql.And(
				mysql.Quote("pr", "user_id").EQ(mysql.Arg(userID)),
				mysql.Quote("pr", "post_id").EQ(mysql.Arg(postID))))),
		&reaction.ID, &reaction.Name, &reaction.Count,
	)

	return
}

func DeletePostReaction(userID, postID int64) (err error) {
	_, err = queryExec(
		mysql.Delete(
			dm.From("post_reactions"),
			dm.Where(mysql.And(
				mysql.Quote("user_id").EQ(mysql.Arg(userID)),
				mysql.Quote("post_id").EQ(mysql.Arg(postID)))),
		),
	)

	return
}

func CreatePostComment(userID, postID int64, body string) (commentID int64, err error) {
	res, err := queryExec(
		mysql.Insert(
			im.Into("comments", "user_id", "post_id", "body"),
			im.Values(mysql.Arg(userID, postID, body)),
		),
	)

	if err != nil {
		return
	}

	commentID, err = res.LastInsertId()

	return
}

func GetPostComments(limit, offset int64, filters []bob.Expression, sortBy any) (comments []api.Comment, err error) {
	var comment api.Comment

	comments, err = queryMany(
		mysql.Select(
			sm.Columns(
				mysql.Quote("c", "id"),
				mysql.Quote("c", "post_id"),
				mysql.Quote("c", "body"),
				mysql.Quote("u", "id"),
				mysql.Quote("u", "username"),
				mysql.Quote("u", "role"),
				mysql.Quote("u", "bio"),
				mysql.Quote("u", "avatar"),
				mysql.Quote("u", "created_at"),
				mysql.Quote("u", "deleted_at").IsNotNull(),
				mysql.Quote("c", "created_at"),
				mysql.Quote("c", "updated_at"),
				mysql.Quote("c", "deleted_at").IsNotNull()),
			sm.From("comments").As("c"),
			sm.InnerJoin("users").As("u").OnEQ(mysql.Quote("u", "id"), mysql.Quote("c", "user_id")),
			sm.Where(mysql.And(filters...)),
			sm.OrderBy(sortBy).Desc(),
			sm.OrderBy(mysql.Quote("c", "id")).Asc(),
			sm.Limit(limit),
			sm.Offset(offset)),
		&comment, &comment.ID, &comment.PostID, &comment.Body, &comment.Author.ID, &comment.Author.Username, &comment.Author.Role, &comment.Author.Bio, &comment.Author.Avatar, &comment.Author.CreatedAt, &comment.Author.Deleted, &comment.CreatedAt, &comment.UpdatedAt, &comment.Deleted,
	)

	return
}

func GetPostComment(commentID int64) (comment api.Comment, err error) {
	err = queryOne(
		mysql.Select(
			sm.Columns(
				mysql.Quote("c", "id"),
				mysql.Quote("c", "post_id"),
				mysql.Quote("c", "body"),
				mysql.Quote("u", "id"),
				mysql.Quote("u", "username"),
				mysql.Quote("u", "role"),
				mysql.Quote("u", "bio"),
				mysql.Quote("u", "avatar"),
				mysql.Quote("u", "created_at"),
				mysql.Quote("u", "deleted_at").IsNotNull(),
				mysql.Quote("c", "created_at"),
				mysql.Quote("c", "updated_at"),
				mysql.Quote("c", "deleted_at").IsNotNull()),
			sm.From("comments").As("c"),
			sm.InnerJoin("users").As("u").OnEQ(mysql.Quote("u", "id"), mysql.Quote("c", "user_id")),
			sm.Where(mysql.Quote("c", "id").EQ(mysql.Arg(commentID)))),
		&comment.ID, &comment.PostID, &comment.Body, &comment.Author.ID, &comment.Author.Username, &comment.Author.Role, &comment.Author.Bio, &comment.Author.Avatar, &comment.Author.CreatedAt, &comment.Author.Deleted, &comment.CreatedAt, &comment.UpdatedAt, &comment.Deleted,
	)

	return
}

func UpdatePostComment(commentID int64, body string) (err error) {
	_, err = queryExec(
		mysql.Update(
			um.Table("comments"),
			um.SetCol("body").ToArg(body),
			um.Where(mysql.And(
				mysql.Quote("id").EQ(mysql.Arg(commentID)),
				mysql.Quote("deleted_at").IsNull())),
		),
	)

	return
}

func DeletePostComment(commentID int64) (err error) {
	_, err = queryExec(
		mysql.Update(
			um.Table("comments"),
			um.SetCol("deleted_at").To(mysql.F("NOW")),
			um.Where(mysql.And(
				mysql.Quote("id").EQ(mysql.Arg(commentID)),
				mysql.Quote("deleted_at").IsNull())),
		),
	)

	return
}

func CreateCommentReaction(userID, commentID int64, reaction string) (err error) {
	_, err = queryExec(
		mysql.Insert(
			im.Into("comment_reactions", "user_id", "comment_id", "reaction_id"),
			im.Query(mysql.Select(
				sm.Columns(mysql.Arg(userID), mysql.Arg(commentID), "id"),
				sm.From("reactions"),
				sm.Where(mysql.And(
					mysql.Quote("name").EQ(mysql.Arg(reaction)),
					mysql.Quote("type").EQ(mysql.Arg("comment")))),
			)),
			im.OnDuplicateKeyUpdate(
				im.UpdateCol("reaction_id").To("id"),
			),
		),
	)

	return
}

func GetCommentReactions(commentID int64) (reactions []api.Reaction, err error) {
	var reaction api.Reaction

	reactions, err = queryMany(
		mysql.Select(
			sm.Columns(
				mysql.Quote("r", "id"),
				mysql.Quote("r", "name"),
				mysql.F("COUNT", mysql.Quote("r", "id"))),
			sm.From("comment_reactions").As("cr"),
			sm.InnerJoin("reactions").As("r").OnEQ(mysql.Quote("r", "id"), mysql.Quote("cr", "reaction_id")),
			sm.Where(mysql.Quote("cr", "comment_id").EQ(mysql.Arg(commentID))),
			sm.GroupBy(mysql.Quote("r", "id"))),
		&reaction, &reaction.ID, &reaction.Name, &reaction.Count,
	)

	return
}

func GetCommentReaction(userID, commentID int64) (reaction api.Reaction, err error) {
	err = queryOne(
		mysql.Select(
			sm.Columns(
				mysql.Quote("r", "id"),
				mysql.Quote("r", "name"),
				"1"),
			sm.From("comment_reactions").As("cr"),
			sm.InnerJoin("reactions").As("r").OnEQ(mysql.Quote("r", "id"), mysql.Quote("cr", "reaction_id")),
			sm.Where(mysql.And(
				mysql.Quote("cr", "user_id").EQ(mysql.Arg(userID)),
				mysql.Quote("cr", "comment_id").EQ(mysql.Arg(commentID))))),
		&reaction.ID, &reaction.Name, &reaction.Count,
	)

	return
}

func DeleteCommentReaction(userID, commentID int64) (err error) {
	_, err = queryExec(
		mysql.Delete(
			dm.From("comment_reactions"),
			dm.Where(mysql.And(
				mysql.Quote("user_id").EQ(mysql.Arg(userID)),
				mysql.Quote("comment_id").EQ(mysql.Arg(commentID)))),
		),
	)

	return
}

func CreateTag(name, color, description string) (tagID int64, err error) {
	res, err := queryExec(
		mysql.Insert(
			im.Into("tags", "name", "color", "description"),
			im.Values(mysql.Arg(name, color, description)),
		),
	)

	if err != nil {
		return
	}

	tagID, err = res.LastInsertId()

	return
}

func GetTags(limit, offset int64, filters []bob.Expression) (tags []api.Tag, err error) {
	var tag api.Tag

	tags, err = queryMany(
		mysql.Select(
			sm.Columns(
				mysql.Quote("t", "id"),
				mysql.Quote("t", "name"),
				mysql.Quote("t", "color"),
				mysql.Quote("t", "description")),
			sm.From("tags").As("t"),
			sm.LeftJoin("post_tags").As("pt").OnEQ(mysql.Quote("pt", "tag_id"), mysql.Quote("t", "id")),
			sm.LeftJoin("posts").As("p").OnEQ(mysql.Quote("p", "id"), mysql.Quote("pt", "post_id")),
			sm.Where(mysql.And(
				append(filters, mysql.Quote("p", "deleted_at").IsNull())...)),
			sm.GroupBy(mysql.Quote("t", "id")),
			sm.OrderBy(mysql.F("COUNT", mysql.Quote("p", "id"))).Desc(),
			sm.OrderBy(mysql.Quote("t", "id")).Asc(),
			sm.Limit(limit),
			sm.Offset(offset)),
		&tag, &tag.ID, &tag.Name, &tag.Color, &tag.Description,
	)

	return
}

func GetTag(tagID int64) (tag api.Tag, err error) {
	err = queryOne(
		mysql.Select(
			sm.Columns(
				mysql.Quote("t", "id"),
				mysql.Quote("t", "name"),
				mysql.Quote("t", "color"),
				mysql.Quote("t", "description")),
			sm.From("tags").As("t"),
			sm.Where(mysql.Quote("t", "id").EQ(mysql.Arg(tagID)))),
		&tag.ID, &tag.Name, &tag.Color, &tag.Description,
	)

	return
}

func UpdateTag(tagID int64, color, description string) (err error) {
	_, err = queryExec(
		mysql.Update(
			um.Table("tags"),
			um.SetCol("color").ToArg(color),
			um.SetCol("description").ToArg(description),
			um.Where(mysql.Quote("id").EQ(mysql.Arg(tagID)))),
	)

	return
}

func CreatePostTag(postID int64, tag string) (err error) {
	_, err = queryExec(
		mysql.Insert(
			im.Into("post_tags", "post_id", "tag_id"),
			im.Query(mysql.Select(
				sm.Columns(mysql.Arg(postID), "id"),
				sm.From("tags"),
				sm.Where(mysql.Quote("name").EQ(mysql.Arg(tag))))),
		),
	)

	return
}
