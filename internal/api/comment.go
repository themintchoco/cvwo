package api

import (
	"encoding/json"
	"time"
)

type baseComment struct {
	ID      uint `json:"id"`
	PostID  uint `json:"postId"`
	Deleted bool `json:"deleted"`
}

type Comment struct {
	baseComment
	Body      string    `json:"body"`
	Author    User      `json:"author"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (c Comment) MarshalJSON() ([]byte, error) {
	if c.Deleted {
		return json.Marshal(baseComment{
			ID:      c.ID,
			PostID:  c.PostID,
			Deleted: c.Deleted,
		})
	}

	type alias Comment
	return json.Marshal(alias(c))
}
