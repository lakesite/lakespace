# lakespace #

workspace configuration manager

## Supported Platforms ##

Currently, only Linux (and specifically Ubuntu) is supported.  Future
versions may support OSX, FreeBSD and Windows.

## Installation ##

npm install lakespace

## Dependencies ##

External tools are required to manage application windows, and the
default terminal on Ubuntu (gnome-terminal).  Future versions will
allow this to be configured and will have defaults (cmd, iTerm) for
other platforms.

    ### Linux ###

    * gnome-terminal
    * wmctrl

## Usage ##

Create a configuration file (lakespace.toml) and run:

    $ lakespace

Or for a specific configuration:

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

Applying resize will resize the browser, ide or terminal.  These
features currently only work under Linux.

The default position (0,0) is the top left, and by default the window
of the application is not resized.


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
offset = "1940,50"
resize = "1800,500"
browser = 'chromium-browser'
tabs = [
	"http://news.ycombinator.com/",
	"http://lobste.rs/"
]

[ide]
editor = 'atom'
path = ''

[terminal_1]
offset = "3860,50"
resize = "1800,750"
working_directory = "/home/"
command = "ls -la"
command = "cd ~/projects/; ls -la"
```
