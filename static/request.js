const request = new (class Requester {
  get(url) {
    return this.request('GET', url);
  }
  
  post(url, body) {
    return this.request('POST', url, body);
  }
  
  request(method, url, body) {
    const request = new XMLHttpRequest();
    request.open(method, url, true);
    if (body) {
      request.setRequestHeader('Content-Type', 'application/json');
    }
    return new Promise((res, rej) => {
      request.onload = function() {
        if (request.status >= 400) {
          const err = new Error(request.status);
          err.body = request.responseText;
          rej(err);
        } else {
          res(request.responseText);
        }
      };
      request.onerror = function(err) {
        rej(err);
      };
      request.send(JSON.stringify(body));
    });
  }
})();