var express = require('express');

var foo = express();

foo.get('/', function(req, res){
  res.send('Hello World');
});

/* istanbul ignore next */
if (!module.parent) {
  foo.listen(3000);
  console.log('Express started on port 3000');
}