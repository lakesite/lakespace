# lakespace #

workspace utility manager

## Dependencies ##

If you're using Linux, and want to use gnome-terminals for auto
launching terminals, you need wmctrl.

## Installation ##

npm install lakespace

## Usage ##

Create a configuration file (lakespace.toml) and run:

    $ lakespace

Or

    $ lakespace configuration.toml

## lakespace.toml ##

The configuration file example is broken down into browser
spaces [ws1], [ws2], etc, an [ide] configuration, and [terminal_]
sections.  The default browser used unless specified is 'firefox' with
a default IDE 'atom'.  Terminals use gnome-terminal on linux, and are
not tested or supported on OSX or Windows.

The [lakespace] section must come first, and contains workspace
specific settings such as the desktop the applications should be
started under or moved to.

Applying desktop and offset to another section will move the current
selected window to the appropriate desktop with x,y offset.

```
[lakespace]
desktop = "3"

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

[terminal_1]
working_directory = "/home/"
command = "ls -la"
command = "cd ~/projects/; ls -la"
```
