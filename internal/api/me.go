package api

type Me struct {
	ID    uint `json:"id"`
	Prefs any  `json:"prefs"`
}
