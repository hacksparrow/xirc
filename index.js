
// Commandline stuff
var program = require('commander');
program
  .version('0.0.1')
  .option('-n, --nick [nick]', 'IRC nickname')
  .option('-s, --server [server]', 'IRC server host')
  .option('-p, --port [port]', 'IRC server port')
  .parse(process.argv);

// Module dependencies
var tw = require('./termwriter');
var keypress = require('keypress');
var irc = require('irc');

// Set some defaults
var server = program.server || 'irc.freenode.net';
var nick = program.nick || ('xirc' + Math.ceil(Math.random()*1000000));
var port = program.port || 6667;

var config = {
  server: server,
  nick: nick,
  userName: 'xIRC',
  realName: 'xIRC Client',
  port: port,
  autoRejoin: true,
  channels: ['#lulz'],
  quit_message: 'xIRC user quit'
};

var client_info = {
  name: 'xirc',
  version: '0.0.0',
  env: ''
};

var CTCP_DELIM = String.fromCharCode(1);

/************************* Connection-related Stuff *************************/

var client = new irc.Client(config.server, config.nick, config);
// This version will support connection to a single server
var connection = {
  channels: {},
  queries: {},
  status: {
    // buffer on the window
    buffer: '',
    // input on the commandline
    input: ''
  }
};

// Window in focus
var current_window = connection.status;
var LF = '\n';
// to indicate whether user exited or disconnected
var exit = false;

/************************* Helper functions *************************/


// Show a window with optional line
var update_display = function (window) {

  tw.clear((current_window.buffer + current_window.input));

  if (window) {
    current_window = window;
    update_display();
  }
  else {
    tw.line(current_window.buffer);
    tw.line(Array(process.stdout.columns).join('-'));
    tw.write('> ' + current_window.input);
  }

};


/************************* IRC events *************************/

connection.status.buffer += 'Connecting to ' + config.server + LF;
update_display();

client.on('connect', function(msg) {
  connection.status.buffer += 'Connected to ' + config.server + LF;
  update_display();
});

client.conn.on('end', function() {
  connection.status.buffer += 'Disconnected' + LF;
  update_display();
  if (exit) { process.exit(); }
});

client.on('motd', function(msg) {
  connection.status.buffer += msg;
  update_display();
});

client.on('join', function(channel, nick) {

  var msg;
  channel = channel.toLowerCase();

  // add the channel to the channel list
  if (!(channel in connection.channels)) {
    connection.channels[channel] = {
      buffer: '',
      input: ''
    };
  }

  var chan = connection.channels[channel];

  if (nick === client.nick) {
    msg = '* Now talking on ' + channel + LF;
    chan.buffer += msg;

    // set the channel as the active window
    update_display(chan);
  } else {
    msg = nick + ' has joined the channel' + LF;
    chan.buffer += msg;
    update_display(chan);
  }
});

client.on('notice', function(nick, to, buffer, message) {
  // No nick specified, so it must be connection notice
  if (!nick) {
    connection.status.buffer += buffer + LF;
    update_display();
  }
  else {
     connection.status.buffer += buffer + LF;
     update_display();
  }
  //console.log(message);
});

client.on('message', function(from, to, message) {

  var msg;

  // channel message
  if (to[0] === '#' || to[0] === '&' || to[0] === '+' || to[0] === '!') {
    if (message.substr(0, 7) === CTCP_DELIM + 'ACTION') {
      msg = '* ' + from + ' ' + message.substring(8, message.length-1);
      current_window.buffer += msg + LF;
    } else {
      msg = '<' + from + '> ' + message;
      current_window.buffer += msg + LF;
    }
    update_display();
  }
  else {
    console.log('-> ' + message);
  }
});

/************************* Keyboard-related Stuff *************************/

// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();

var input = '';
// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {

  // detect enter
  if (key && key.name == 'return') {

    // command
    if (current_window.input[0] == '/') {

      var input = current_window.input;
      var cmd = input.substring(1).split(' ', 1).join('').trim();
      var args = input.substring(input.indexOf(cmd)+cmd.length+1).trim();

      switch (cmd.toLowerCase()) {

        case 'j':
        case 'join':
          if (args.length) {
            if (args[0] !== '#' && args[0] !== '&' && args[0] !== '+' && args[0] !== '!') { args = "#" + args; }
            if (args.length > 1 && !connection.channels[args]) { client.join(args); }
          }
        break;
        case 'part':
          var name = current_window;
          if (name[0] === '#' || name[0] === '&' || name[0] === '+' || name[0] === '!') {
            client.part(name);
            delete connection.channels[name];
          }
        break;
        case 'nick':
          if (args.length) {
            var newnick = args.split(' ', 1).join('');
            if (newnick) {
              client.prevnick = client.nick;
              client.send('NICK', newnick);
              client.nick = newnick;
            }
          }
        break;
        case 'exit':
          exit = true;
          // if client is already disconnected
          if (client.conn.destroyed) {
            process.exit();
          }
          // disconnect from server and then exit
          else {
            client.disconnect();
          }
        break;
        case 'quit':
          if (args.length) { client.disconnect(args); }
          else {
            client.disconnect();
          }
        break;
        case 'connect':
        case 'server':
          if (args.length) {
            // TODO: this is not creating a new connection
            client = new irc.Client(config.server, config.nick, config);
          }
          else {
            
          }
        break;
      }

    }
    // input to the current window
    else {

      var who = current_window;
      var message = current_window.input;

      if (!who.length || !message.length) {
        current_window.buffer += 'Invalid arguments' + LF;
      }
      else {
        client.say(who, message);
        current_window.buffer += message + LF;
      }

    }

    current_window.input = '';
    update_display();
  }
  // close client
  else if (key && key.ctrl && key.name == 'c') {
    process.exit();
  }
  // buffer buffer
  else {
    current_window.input += ch;
    update_display();
  }

});


