package api

import (
	"encoding/json"
	"time"
)

type basePost struct {
	ID      uint `json:"id"`
	Deleted bool `json:"deleted"`
}

type Post struct {
	basePost
	Title        string    `json:"title"`
	Body         string    `json:"body"`
	Author       User      `json:"author"`
	CommentCount uint      `json:"commentCount"`
	Tags         Tags      `json:"tags"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func (p Post) MarshalJSON() ([]byte, error) {
	if p.Deleted {
		return json.Marshal(basePost{
			ID:      p.ID,
			Deleted: p.Deleted,
		})
	}

	type alias Post
	return json.Marshal(alias(p))
}
