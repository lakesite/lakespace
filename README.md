# lakespace #

workspace utility manager

## Installation ##

npm install lakespace

## Usage ##

Create a configuration file (lakespace.toml) and run:

    $ lakespace

Or

    $ lakespace configuration.toml

## lakespace.toml ##

The configuration file example is broken down into browser
spaces [ws1], [ws2], etc, and an [ide] configuration.  The default
browser used unless specified is 'firefox' with a default IDE 'atom'.

```
[ws1]
browser = 'firefox'
tabs = [
	"https://github.com/toml-lang/",
	"http://localhost:8095/index.html",
	"https://lakesite.net/"
]

[ws2]
browser = 'chromium-browser'
tabs = [
	"http://news.ycombinator.com/",
	"http://lobste.rs/"
]

[ide]
editor = 'atom'
path = ''
```
