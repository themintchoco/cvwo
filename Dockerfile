# Build frontend

FROM node:20-alpine AS frontend

ARG MAX_UPLOAD_SIZE

WORKDIR /app

COPY web/package.json .
COPY web/package-lock.json .

RUN npm ci

COPY web .

ENV VITE_MAX_UPLOAD_SIZE=${MAX_UPLOAD_SIZE}

RUN npm run build

# Build backend

FROM golang:1.21-bookworm AS backend

WORKDIR /app

RUN apt-get update
RUN apt-get install -y --no-install-recommends libvips-dev

COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

RUN go build -o cmd/server/server cmd/server/main.go

# Run

FROM debian:bookworm-slim

ARG UID=1000
ARG GID=1000

WORKDIR /app

RUN apt-get update
RUN apt-get install -y --no-install-recommends libvips

RUN groupadd -g "${GID}" app
RUN useradd -u "${UID}" -g "${GID}" app
RUN chown -R app:app .

COPY --from=frontend --chown=app:app /app/dist ./web/dist
COPY --from=backend --chown=app:app /app/cmd/server/server .

EXPOSE 3000

USER app

ENTRYPOINT [ "./server" ]
