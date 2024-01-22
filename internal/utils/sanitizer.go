package utils

import (
	"github.com/microcosm-cc/bluemonday"
)

var policy *bluemonday.Policy = bluemonday.UGCPolicy()

func Sanitize(dirty string) string {
	return policy.Sanitize(dirty)
}
