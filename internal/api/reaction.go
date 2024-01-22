package api

type Reaction struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Count uint   `json:"count"`
}
