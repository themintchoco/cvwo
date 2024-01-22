package api

import "encoding/json"

type baseUser struct {
	Deleted bool `json:"deleted"`
}

type User struct {
	baseUser
	ID           uint    `json:"id"`
	Username     string  `json:"username"`
	Role         string  `json:"role"`
	Bio          *string `json:"bio"`
	Avatar       *string `json:"avatar"`
	PostCount    *uint   `json:"postCount"`
	CommentCount *uint   `json:"commentCount"`
	CreatedAt    string  `json:"createdAt"`
}

func (u User) MarshalJSON() ([]byte, error) {
	if u.Deleted {
		return json.Marshal(baseUser{
			Deleted: u.Deleted,
		})
	}

	type alias User
	return json.Marshal(alias(u))
}
