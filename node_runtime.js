/*
MIT License

Copyright (c) 2018 rrainn, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

See: https://github.com/rrainn/aws-lambda-custom-node-runtime/blob/440e4448dcf1c9c7b70a25154ec5a1aa24cfa72c/templates/node_runtime.js
*/

var http = require("http");
var Buffer = require("buffer").Buffer;

function run() {
  request(
    {
      url:
        process.env.AWS_LAMBDA_RUNTIME_API +
        "/2018-06-01/runtime/invocation/next"
    },
    function(err, invoke_result) {
      if (err) {
        return request(
          {
            url:
              process.env.AWS_LAMBDA_RUNTIME_API +
              "/2018-06-01/runtime/init/error",
            method: "POST",
            data: err
          },
          run
        );
      }
      var event_data = invoke_result.data;
      var request_id =
        invoke_result.resp.headers["lambda-runtime-aws-request-id"];

      var response = require(process.env.LAMBDA_TASK_ROOT +
        "/" +
        process.env._HANDLER.split(".")[0] +
        ".js")[process.env._HANDLER.split(".")[1]](
        JSON.parse(event_data),
        {},
        function(err, result) {
          if (err) {
            failure(err);
          } else {
            success(result);
          }
        }
      );
      if (response && response.then && typeof response.then === "function") {
        response.then(success);
      }
      if (response && response.catch && typeof response.catch === "function") {
        response.catch(failure);
      }

      function success(result) {
        request(
          {
            url:
              process.env.AWS_LAMBDA_RUNTIME_API +
              "/2018-06-01/runtime/invocation/" +
              request_id +
              "/response",
            method: "POST",
            data: result
          },
          run
        );
      }
      function failure(err) {
        request(
          {
            url:
              process.env.AWS_LAMBDA_RUNTIME_API +
              "/2018-06-01/runtime/invocation/" +
              request_id +
              "/error",
            method: "POST",
            data: err
          },
          run
        );
      }
    }
  );
}
run();

function request(options, cb) {
  if (!cb) {
    cb = function() {};
  }
  if (options.data && typeof options.data === "object") {
    options.data = JSON.stringify(options.data);
  }
  if (options.data && !options.headers) {
    options.headers = {};
  }
  if (options.data && !options.headers["Content-Length"]) {
    options.headers["Content-Length"] = Buffer.byteLength(options.data);
  }
  if (options.data && !options.headers["Content-Type"]) {
    options.headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  options.timeout = 1000;
  var req = http
    .request("http://" + options.url, options, function(resp) {
      var data = "";
      resp.on("data", function(chunk) {
        data += chunk;
      });
      resp.on("end", function() {
        cb(null, { data: data, resp: resp });
      });
    })
    .on("error", function(err) {
      cb(err);
    });

  if (options.data) {
    req.write(options.data);
  }
  req.end();
}
