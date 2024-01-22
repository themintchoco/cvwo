package api

import (
	"encoding/json"
	"strconv"
	"strings"
)

type Tags string

func (t Tags) MarshalJSON() ([]byte, error) {
	tags := make([]uint, 0)

	for _, tag := range strings.Split(string(t), ",") {
		tagID, err := strconv.ParseInt(tag, 10, 64)

		if err != nil {
			continue
		}

		tags = append(tags, uint(tagID))
	}

	return json.Marshal(tags)
}
