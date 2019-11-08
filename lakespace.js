#!/usr/bin/env node

// #############################################################################
// lakespace
//
// given a workspace.toml toml file, open chrome/firefox windows, ide, terminals.
//
// #############################################################################
'use strict';


const path = require("path");
const argv = require('minimist')(process.argv.slice(2));
const cp = require('child_process');
const sleep = require('sleep');


var toml = require('toml');
var validUrl = require('valid-url');
var fs = require('fs');

// supported platforms;
var supported_platforms = ['win32', 'linux', 'darwin']

// platform specific dependencies
if process.platform == 'darwin' {
  var applescript = require('applescript')
}

// defaults
var configuration = "lakespace.toml";
var browser = 'firefox';
var editor = 'atom';
var project_root = '.';
var desktop = "0";

// when 1, only show commands but do not execute.
var dryrun = 0;

// track full paths to prevent circular references
var config_file_instances = [];

// array for commands
var cmdStack = [];


var serial_cmd = function() {
  Object.keys(cmdStack).forEach(function(key) {
    var val = cmdStack[key];
    if (dryrun == 1) {
      console.log(`${val}`);
    } else {
      switch(process.platform) {
        case 'win32':
          // handle win10+
          break;
        case 'darwin':
          // handle osx
          var child = cp.spawn(val, { shell: '/bin/bash', stdio: 'ignore', detached: true});
          child.unref();
          sleep.sleep(1);
          break;
        case 'linux':
          var child = cp.spawn(val, { shell: '/bin/bash', stdio: 'ignore', detached: true});
          child.unref();
          sleep.sleep(1);
        default:
          // panic!
          break;
      }
    }
  });
}


var resize_app = function(offset, resize) {
  switch(process.platform) {
    case 'linux':
      cmdStack.push("wmctrl -r :ACTIVE: -e 0," + offset + "," + resize);
      break;
    case 'win32':
      break;
    case 'darwin':
      break;
    default:
      // panic
      break;
  }
}


var ide_branch = function(data) {
  var offset = "0,0";
  var resize = "-1,-1";

  Object.keys(data).forEach(function(key) {
    var val = data[key];

    if (key == 'offset') {
      offset = val;
    }

    if (key == 'resize') {
      resize = val;
    }

    if (key == 'editor') {
      editor = val;
    }

    if (key == 'project_root') {
      project_root = path.resolve(val);
    }
  });

  switch(process.platform) {
    case 'linux':
      cmdStack.push(editor + ' ' + project_root);
      break;
    case 'darwin':
      // if project_root is ., need to get cwd
      cmdStack.push('open -n -a ' + editor + ' --args ' + project_root);
      break;
    case 'win32':
      break;
    default:
      // panic
      break;
  }
  resize_app(offset, resize);
}


var terminal_branch = function(data) {
  var working_directory = "~";
  var terminal_command = ""
  switch(process.platform) {
    case 'linux':
      terminal_command = "gnome-terminal --window";
      break;
    case 'darwin':
      terminal_command = "open -n -a iterm2";
      break;
    case 'win32':
      terminal_command = "wt.exe"
      break;
    default:
      // panic
      break;
  }

  var tabcount = 0;
  var offset = "0,0";
  var resize = "-1,-1";

  Object.keys(data).forEach(function(key) {
    var val = data[key];

    if (key == 'offset') {
      offset = val;
    }

    if (key == 'resize') {
      resize = val;
    }

    if (key == 'working_directory') {
      working_directory = val;
    }

    if (key.startsWith('command_')) {
      if (tabcount == 0) {
        terminal_command = terminal_command + " --working-directory=" + working_directory + " -e \"bash -c '" + val + "; bash'\"";
        tabcount++;
      } else {
        terminal_command = terminal_command + " --tab --working-directory=" + working_directory + " -e \"bash -c '" + val + "; bash'\"";
      }
    }
  });
  cmdStack.push(terminal_command);
  resize_app(offset, resize);
}


var browser_branch = function(data) {
  var offset = "0,0";
  var resize = "-1,-1";
  var browser_command = "";

  Object.keys(data).forEach(function(key) {
    var val = data[key];

    if (key == 'offset') {
      offset = val;
    }

    if (key == 'resize') {
      resize = val;
    }

    if (key == 'browser') {
      browser = val;
    }

    if (key == 'tabs') {
      switch(process.platform) {
        case 'linux':
          // at least on ubuntu, launching firefox with multiple
          // sites/tabs requires they be enclosed in quotes, as
          // some urls will break otherwise.
          cmdStack.push(browser + ' "' + val.join('" "') + '"');
          break;
        case 'darwin':
          cmdStack.push('open -n -a ' + browser + ' --args "' + val.join('" "') + '"');
          break;
        case 'win32':
          break;
        default:
          // panic
          break;
      }
    }

    if (key == 'editor') {
      switch(process.platform) {
        case 'linux':
          cmdStack.push(val + ' . ');
          break;
        case 'darwin':
          cmdStack.push('open -n -a ' + val + '--args . ');
          break;
        case 'win32':
          break;
        default:
          // panic
          break;
      }
    }
  });
  resize_app(offset, resize);
}


var lakespace_branch = function(data) {
  Object.keys(data).forEach(function(key) {
    var val = data[key];

    if (key == 'desktop') {
      desktop = val;
      // pre-empt switch to desktop as normal behavior;
      switch(process.platform) {
        case 'darwin':
          // applescript inline
          break;
        case 'win32':
          break;
        case 'linux':
          cmdStack.push(`wmctrl -s ${desktop}`);
          break;
        default:
          // panic!
          break;
      }
    }

    if (key.startsWith('include_')) {
      parse_file(val);
    }
  });
}

var tree = function (data) {
  Object.keys(data).forEach(function(key) {
    var val = data[key];

    // could be a new section group, flag it
    if (typeof val == 'object') {
      // so we can have multiple groups, split on _
      var index = key.split('_')[0];
      switch(index) { // key
        case 'lakespace':
          lakespace_branch(val);
          break;
        case 'ide':
          ide_branch(val);
          break;
        case 'terminal':
          terminal_branch(val);
        default:
          browser_branch(val);
      }
    } // else { root property }
  });
}


var parse_file = function (config_file) {
  if (config_file_instances.includes(config_file)) {
    console.log(`Refusing to parse ${config_file} more than once.`)
    return;
  }
  config_file_instances.push(config_file);

  var str = fs.readFileSync(path.resolve(process.cwd(), config_file), 'utf8')
  var parsed = toml.parse(str);

  tree(parsed);
}


var main = function() {
  // before we do anything, let's ensure we have a supported
  // platform
  if (!supported_platforms.includes(process.platform)) {
    console.log(`Platform '${process.platform}' is not supported.`);
    process.exit(0);
  }

  if (argv["_"][0] !== undefined) {
    configuration = argv["_"][0];
  }

  if (argv["dryrun"]) {
    dryrun = 1;
  }

  parse_file(configuration);
  serial_cmd(cmdStack);
}


main();
