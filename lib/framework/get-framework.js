'use strict';

const http = require('http')
const Response = require('../response');

function common(cb, opts) {
  return request => {
    const response = new Response(request, opts);

    cb(request, response);

    return response;
  };
}

module.exports = function getFramework(app, opts) {
  if (app instanceof http.Server) {
    return request => {
      const response = new Response(request, opts);
      app.emit('request', request, response)
      return response
    }
  }

  if (typeof app.callback === 'function') {
    return common(app.callback(), opts);
  }

  if (typeof app.handle === 'function') {
    return common((request, response) => {
      app.handle(request, response);
    }, opts);
  }

  if (typeof app.handler === 'function') {
    return common((request, response) => {
      app.handler(request, response);
    }, opts);
  }

  if (typeof app._onRequest === 'function') {
    return common((request, response) => {
      app._onRequest(request, response);
    }, opts);
  }

  if (typeof app === 'function') {
    return common(app, opts);
  }

  if (app.router && typeof app.router.route == 'function') {
    return common((req, res) => {
      const { url, method, headers, body } = req;
      app.router.route({ url, method, headers, body }, res);
    }, opts);
  }

  if (app._core && typeof app._core._dispatch === 'function') {
    return common(app._core._dispatch({
      app
    }), opts);
  }

  if (typeof app.inject === 'function') {
    return async request => {
      const { method, url, headers, body } = request;

      const res = await app.inject({ method, url, headers, payload: body })

      return Response.from(res);
    };
  }

  if (typeof app.main === 'function') {
    return common(app.main, opts);
  }

  throw new Error('Unsupported framework');
};
