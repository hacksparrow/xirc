
var stdout = process.stdout;
var NL = '\n';
var writing = false;
var lines = 0;

// Write a new line to the console
exports.line = function(string) {
  if (writing) return;

  writing = true;
  stdout.write(string + NL);
  writing = false;
};

// Write a text to the console - no new line
exports.write = function(string) {
  if (writing) return;

  writing = true;
  stdout.write(string);
  writing = false;
};

// Clear everything from the console
exports.clear = function(buffer) {
  var lines = buffer.split('\n').length + 1;
  stdout.moveCursor(0, -lines);
  stdout.clearScreenDown();
};

