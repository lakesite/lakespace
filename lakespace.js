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

var configuration = "lakespace.toml";
var cmdStack = [];
var browser = 'firefox';
var editor = 'atom';
var project_root = '.';
var desktop = "0";

// track full paths to prevent circular references
var config_file_instances = [];


var serial_cmd = function() {
  Object.keys(cmdStack).forEach(function(key) {
    var val = cmdStack[key];
    // console.log(`Running command: ${val}`);
    // need to make this work on different platforms.
    var child = cp.spawn(val, { shell: '/bin/bash', stdio: 'ignore', detached: true});
    child.unref();
    sleep.sleep(1);
  });
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
      project_root = val;
    }
  });
  cmdStack.push("wmctrl -r :ACTIVE: -e 0," + offset + "," + resize);
}


var terminal_branch = function(data) {
  var working_directory = "~";
  var terminal_command = "gnome-terminal --window";
  var tabcount = 0;
  var offset = "0,0";
  var resize = "-1,-1";

  Object.keys(data).forEach(function(key) {
    var val = data[key];

    if (key == 'desktop') {
      cmdStack.push("wmctrl -r :ACTIVE: -t " + val);
    }

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
  cmdStack.push("wmctrl -r :ACTIVE: -e 0," + offset + "," + resize);
}


var browser_branch = function(data) {
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

    if (key == 'browser') {
      browser = val;
    }

    if (key == 'tabs') {
      // at least on ubuntu, launching firefox with multiple
      // sites/tabs requires they be enclosed in quotes, as
      // some urls will break otherwise.
      cmdStack.push(browser + ' "' + val.join('" "') + '"');
    }

    if (key == 'editor') {
      cmdStack.push(val + ' . ');
    }
  });
  cmdStack.push("wmctrl -r :ACTIVE: -e 0," + offset + "," + resize);
}


var lakespace_branch = function(data) {
  Object.keys(data).forEach(function(key) {
    var val = data[key];

    if (key == 'desktop') {
      desktop = val;
      // pre-empt switch to desktop as normal behavior;
      cmdStack.push(`wmctrl -s ${desktop}`);
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
          cmdStack.push(editor + ' ' + project_root);
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


if (argv["_"][0] !== undefined) {
  configuration = argv["_"][0];
}

parse_file(configuration);
serial_cmd(cmdStack);
