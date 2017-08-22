Ketting - A hypermedia client for nodejs
========================================

Introduction
------------

This NPM package is an attempt at creating a 'generic' hypermedia client, it
supports an opinionated set of modern features REST services might have.

This means that there's a strong focus on links and link-relationships.
Initially we'll build in strong support for [Web Linking][1], a.k.a. the HTTP
`Link` header, and [HAL][2].


Installation
------------

    npm install --save ketting


Features overview
-----------------

Ketting is a library that sits on top of a Fetch API to provide a RESTful
interface and make it easier to follow REST best practices more strictly.

It provides some useful abstractions that make it easier to work with true
hypermedia / HATEAOS servers. It currently parses [HAL][2] and has a deep
understanding of links and embedded resources. There's also support for parsing
and following links from HTML documents.

Using this library it becomes very easy to follow links from a single bookmark,
and discover resources and features on the server. Embedded resources are
completely hidden. Embedded resources just show up as links, but when you're
asking for the representation, the response to the `GET` request will be
served from a cache.

This feature allows HAL servers to upgrade links to embedded resources, and
allows any client to transparently take advantage of this change and issue
less HTTP requests.


Usage
-----

### Fetching a resource and following a link:

```js
var ketting = require('ketting')('http://my-hal-api.example.org/');

// Fetch the home resource
var home = ketting.getResource()
// Then get the 'author' relationship from _links
home.follow('author')
  .then(function(authorResource)) {

    // Follow the 'me' resource.
    return authorResource.follow('me');

  }.then(function(meResource) {

    // Get the full body
    return meResource.get();

  }.then(function(meBody) {

    // Output the body
    console.log(meBody);

  }).catch(function(err) {

    // Error
    console.log(err);

  });
```

### Following a chain of links

It's possible to follow a chain of links with follow:

```js
client.follow('rel1')
  .then(function(resource1) {
    return resource1.follow('rel2');
  })
  .then(function(resource2) {
    return resource2.follow('rel3');
  })
  .then(function(resource3) {
    console.log(resource3.getLinks());
  });
```

As you can see, `follow()` returns a Promise. However, the returned promise
has an additional `follow()` function itself, which makes it possible to
shorten this to:

```js
client
  .follow('rel1')
  .follow('rel2')
  .follow('rel3')
  .then(function(resource3) {
    console.log(resource3.getLinks());
  });
```

### Providing custom options

Options can be passed via the constructor o the client.

Example:

```js
var bookMark = 'https://my-hal-api.example.org';
var options {
  auth: {
    type: 'basic',
    userName: 'foo',
    password: 'bar'
  },
  accept: 'application/json'
}

var ketting = require('ketting')(bookMark, options);
```

Currently the following options are supported:

* `auth`, an object with autentication information.
* `accept` a list of Content-Types which are accepted. Must follow the same
   format as the HTTP header.
* `contentType` the default contentType the client sends over. By default
  this is `application/hal+json`.


API
---

### Client

```js
var client = new Client(bookMark, options);
```

* `bookMark` - The base URL of the web service.
* `options` _optional_ - A list of options.

#### `Client.getResource()`

Returns a 'Resource' object based on the url. If

```js
var resource = client.getResource(url);
```

* `url` - URL to fetch. Might be relative. If not provided, the bookMark is
  fetched instead.

This function returns a `Resource`.


### Resource

#### `Resource.get()`

Returns the result of a `GET` request. This function returns a `Promise`.

```js
resource.get().then(function(body) {
  console.log(body);
});
```

If the resource was fetched earlier, it will return a cached copy.


#### `Resource.put()`

Updates the resource with a new representation

```js
resource.put({ 'foo' : 'bar' });
```

This function returns a Promise that resolves to `null`.

#### `Resource.delete()`

Deletes the resource.

```js
resource.delete();
````

This function returns a Promise that resolves to `null`.

#### `Resource.post()`

This function is meant to be an easy way to create new resources. It's not
necessarily for any type of `POST` request, but it is really meant as a
convenience method APIs that follow the typical pattern of using `POST` for
creation.

If the HTTP response from the server was successful and contained a `Location`
header, this method will resolve into a new Resource. For example, this might
create a new resource and then get a list of links after creation:

```js
resource.post({ property: 'value'})
  .then(function(newResource) {
    return newResource.links();
  })
  .then(function(links) {
    console.log(links);
  });
```

#### `Resource.refresh()`

Refreshes the internal cache for a resource and does a `GET` request again.
This function returns a `Promise` that resolves when the operation is complete,
but the `Promise` does not have a value.

```js
resource.refresh().then(function() {
  return resource.get()
}).then(function(body) {
  // A fresh body!
});
```

#### `Resource.links()`

Returns a list of `Link` objects for the resource.

```js
resource.links().then(function(links) {
  console.log(links);
});
```

You can also request only the links for a relation-type you are interested in:

```js
resource.links('item').then(function(links) {

});
```


#### `Resource.follow()`

Follows a link, by it's relation-type and returns a new resource for the
target.

```js
resource.follow('author').then(function(author) {
  return author.get();
}).then(function(body) {
  console.log(body);
});
```

The follow function returns a special kind of Promise that has a `follow()`
function itself.

This makes it possible to chain follows:

```js
resource
  .follow('author')
  .follow('homepage')
  .follow('icon');
```

Lastly, it's possible to follow [RFC6570](https://tools.ietf.org/html/rfc6570)
templated links, using the second argument.

For example, a link specified as:

    { href: "/foo{?a}", templated: true}

May be followed using

```js
resource
  .follow('some-templated-link', { a: 'bar'})
```

This would result following a link to the `/foo?a=bar` uri.


#### `Resource.followAll()`

This method works like `follow()` but resolves into a list of resources.
Multiple links with the same relation type can appear in resources; for
example in collections.

```js
resource.followAll('item')
  .then(function(items) {
    console.log(items);
  });
```

#### `Resource.representation()`

This function is similar to `GET`, but instead of just returning a response
body, it returns a `Representation` object.

### `Representation`

The Representation is typically the 'body' of a resource in REST terminology.
It's the R in REST.

The Representation is what gets sent by a HTTP server in response to a `GET`
request, and it's what gets sent by a HTTP client in a `POST` request.

The Representation provides access to the body, a list of links and HTTP
headers that represent real meta-data of the resource. Currently this is only
`Content-Type` but this might be extended to include encoding, language and
cache-related information.


#### `Representation.body`

The `body` property has the body contents of a `PUT` request or a `GET` response.

#### `Representation.links`

The `links` property has the list of links for a resource.

#### `Representation.contentType`

The `contentType` property has the value of the `Content-Type` header for both
requests and responses.


[1]: https://tools.ietf.org/html/rfc5988 "Web Linking"
[2]: http://stateless.co/hal_specification.html "HAL - Hypertext Application Language"
[3]: https://www.npmjs.com/package/request
[6]: https://tools.ietf.org/html/rfc7240 "Prefer Header for HTTP"
