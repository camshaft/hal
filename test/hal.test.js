/**
 * Module dependencies
 */
var should = require("should")
  , hal = require("..")
  , express = require("express");

// Test app
var app = express();

app.use(express.bodyParser());
app.use(app.router);
app.use(function(err, res, req, next) {
  res.send(500, {
    _error: {
      code: 500,
      message: err.message,
      stack: err.stack
    }
  });
});

app.get("/", function(req, res) {
  res.send({
    _links: {
      self: {href: "/"},
      profile: {href: "/profile"}
    }
  })
});

app.get("/profile", function(req, res) {
  res.send({
    _links: {
      self: {href: "/profile"}
    },
    name: "Scott",
    _forms: {
      update: {
        method: "POST",
        fields: {
          name: {value: "Scott"}
        }
      }
    }
  })
});

app.post("/profile", function(req, res) {
  var name = (req.body || {}).name;
  res.send(200, {
    _links: {
      self: {href: "/profile"}
    },
    name: name,
    _forms: {
      update: {
        method: "POST",
        fields: {
          name: {value: name}
        }
      }
    }
  })
});

describe("HAL Client", function(){

  var root;

  before(function(done) {
    var server = app.listen(function() {
      var address = server.address();
      root = "http://"+address.address+":"+address.port;
      done();
    });
  });

  it("should follow a link and submit a form", function(done) {

    hal(root, function(err, client) {
      client
        .follow("profile")
        .set("Authorization", "Bearer "+"testing123")
        .end(function(err, profile) {
          if(err) return done(err);

          profile
            .submit("update")
            .send({name: "Cameron"})
            .end(function(err, result) {
              if(err) return done(err);
              result.body.name.should.eql("Cameron");
              done();
            });

        });
    });

  });
});
