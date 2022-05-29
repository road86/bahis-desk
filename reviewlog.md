1. sync doest seem to wrok for data with dev

Last Data Sync Date: never even though there is an entry in csv_syn_log
i can see taht after a manual syn the unix timesamp is updated in the table but doesnt refresh in the app

farm assesment form:
the parent location data should be automatically pre-filled.
each sync with or without data shows in the table but never in the heading. checking on server

seems data is not on the server

Tried sync with BCC server, I get:
```
1] {
[1]   status: 400,
[1]   message: "<?xml version='1.0' encoding='UTF-8' ?>\n" +
[1]     '<OpenRosaResponse xmlns="http://openrosa.org/http/response">\n' +
[1]     '        <message nature="">Improperly formatted XML.</message>\n' +
[1]     '</OpenRosaResponse>'
[1] }
```
lol. Downloading of data from server at first works it shows download page by page


Tried testing on mpower-dev I get...

```
 14:30:26.368 › ----------- || Attempt To Signin || -----------------
[1] 14:30:26.370 › signin url: http://dyn-bahis-dev.mpower-social.com/bhmodule/app-user-verify/
[1] 14:30:26.371 › {"username":"ghatail","password":"12345678","upazila":202249}
[1] 02:42:f9:0d:9e:5a
[1] 14:30:26.451 › Request failed with status code 409
[1] 14:30:26.452 › -------|| Sign In Error ||-----------
[1] 14:30:26.453 › {
[1]   message: 'Request failed with status code 409',
[1]   name: 'Error',
[1]   stack: 'Error: Request failed with status code 409\n' +
[1]     '    at createError (/home/mix/repos/bahis-desk/node_modules/axios/lib/core/createError.js:16:15)\n' +
[1]     '    at settle (/home/mix/repos/bahis-desk/node_modules/axios/lib/core/settle.js:17:12)\n' +
[1]     '    at IncomingMessage.handleStreamEnd (/home/mix/repos/bahis-desk/node_modules/axios/lib/adapters/http.js:236:11)\n' +
[1]     '    at IncomingMessage.emit (events.js:327:22)\n' +
[1]     '    at endReadableNT (internal/streams/readable.js:1327:12)\n' +
[1]     '    at processTicksAndRejections (internal/process/task_queues.js:80:21)',
[1]   config: {
[1]     url: 'http://dyn-bahis-dev.mpower-social.com/bhmodule/app-user-verify/',
[1]     method: 'post',
[1]     data: '{"username":"ghatail","password":"12345678","upazila":202249}',
[1]     headers: {
[1]       Accept: 'application/json, text/plain, */*',
[1]       'Content-Type': 'application/json',
[1]       'Access-Control-Allow-Origin': '*',
[1]       'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
[1]       'Access-Control-Allow-Headers': '*',
[1]       'User-Agent': 'axios/0.19.2',
[1]       'Content-Length': 61
[1]     },
[1]     transformRequest: [
[1]       '[function] function transformRequest(data, headers) {\n' +
[1]         "    normalizeHeaderName(headers, 'Accept');\n" +
[1]         "    normalizeHeaderName(headers, 'Content-Type');\n" +
[1]         '    if (utils.isFormData(data) ||\n' +
[1]         '      utils.isArrayBuffer(data) ||\n' +
[1]         '      utils.isBuffer(data) ||\n' +
[1]         '      utils.isStream(data) ||\n' +
[1]         '      utils.isFile(data) ||\n' +
[1]         '      utils.isBlob(data)\n' +
[1]         '    ) {\n' +
[1]         '      return data;\n' +
[1]         '    }\n' +
[1]         '    if (utils.isArrayBufferView(data)) {\n' +
[1]         '      return data.buffer;\n' +
[1]         '    }\n' +
[1]         '    if (utils.isURLSearchParams(data)) {\n' +
[1]         "      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');\n" +
[1]         '      return data.toString();\n' +
[1]         '    }\n' +
[1]         '    if (utils.isObject(data)) {\n' +
[1]         "      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');\n" +
[1]         '      return JSON.stringify(data);\n' +
[1]         '    }\n' +
[1]         '    return data;\n' +
[1]         '  }'
[1]     ],
[1]     transformResponse: [
[1]       '[function] function transformResponse(data) {\n' +
[1]         '    /*eslint no-param-reassign:0*/\n' +
[1]         "    if (typeof data === 'string') {\n" +
[1]         '      try {\n' +
[1]         '        data = JSON.parse(data);\n' +
[1]         '      } catch (e) { /* Ignore */ }\n' +
[1]         '    }\n' +
[1]         '    return data;\n' +
[1]         '  }'
[1]     ],
[1]     timeout: 0,
[1]     adapter: '[function] function httpAdapter(config) {\n' +
[1]       '  return new Promise(function dispatchHttpRequest(resolvePromise, rejectPromise) {\n' +
[1]       '    var resolve = function resolve(value) {\n' +
[1]       '      resolvePromise(value);\n' +
[1]       '    };\n' +
[1]       '    var reject = function reject(value) {\n' +
[1]       '      rejectPromise(value);\n' +
[1]       '    };\n' +
[1]       '    var data = config.data;\n' +
[1]       '    var headers = config.headers;\n' +
[1]       '\n' +
[1]       '    // Set User-Agent (required by some servers)\n' +
[1]       "    // Only set header if it hasn't been set in config\n" +
[1]       '    // See https://github.com/axios/axios/issues/69\n' +
[1]       "    if (!headers['User-Agent'] && !headers['user-agent']) {\n" +
[1]       "      headers['User-Agent'] = 'axios/' + pkg.version;\n" +
[1]       '    }\n' +
[1]       '\n' +
[1]       '    if (data && !utils.isStream(data)) {\n' +
[1]       '      if (Buffer.isBuffer(data)) {\n' +
[1]       '        // Nothing to do...\n' +
[1]       '      } else if (utils.isArrayBuffer(data)) {\n' +
[1]       '        data = Buffer.from(new Uint8Array(data));\n' +
[1]       '      } else if (utils.isString(data)) {\n' +
[1]       "        data = Buffer.from(data, 'utf-8');\n" +
[1]       '      } else {\n' +
[1]       '        return reject(createError(\n' +
[1]       "          'Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream',\n" +
[1]       '          config\n' +
[1]       '        ));\n' +
[1]       '      }\n' +
[1]       '\n' +
[1]       '      // Add Content-Length header if data exists\n' +
[1]       "      headers['Content-Length'] = data.length;\n" +
[1]       '    }\n' +
[1]       '\n' +
[1]       '    // HTTP basic authentication\n' +
[1]       '    var auth = undefined;\n' +
[1]       '    if (config.auth) {\n' +
[1]       "      var username = config.auth.username || '';\n" +
[1]       "      var password = config.auth.password || '';\n" +
[1]       "      auth = username + ':' + password;\n" +
[1]       '    }\n' +
[1]       '\n' +
[1]       '    // Parse url\n' +
[1]       '    var fullPath = buildFullPath(config.baseURL, config.url);\n' +
[1]       '    var parsed = url.parse(fullPath);\n' +
[1]       "    var protocol = parsed.protocol || 'http:';\n" +
[1]       '\n' +
[1]       '    if (!auth && parsed.auth) {\n' +
[1]       "      var urlAuth = parsed.auth.split(':');\n" +
[1]       "      var urlUsername = urlAuth[0] || '';\n" +
[1]       "      var urlPassword = urlAuth[1] || '';\n" +
[1]       "      auth = urlUsername + ':' + urlPassword;\n" +
[1]       '    }\n' +
[1]       '\n' +
[1]       '    if (auth) {\n' +
[1]       '      delete headers.Authorization;\n' +
[1]       '    }\n' +
[1]       '\n' +
[1]       '    var isHttpsRequest = isHttps.test(protocol);\n' +
[1]       '    var agent = isHttpsRequest ? config.httpsAgent : config.httpAgent;\n' +
[1]       '\n' +
[1]       '    var options = {\n' +
[1]       "      path: buildURL(parsed.path, config.params, config.paramsSerializer).replace(/^\\?/, ''),\n" +
[1]       '      method: config.method.toUpperCase(),\n' +
[1]       '      headers: headers,\n' +
[1]       '      agent: agent,\n' +
[1]       '      agents: { http: config.httpAgent, https: config.httpsAgent },\n' +
[1]       '      auth: auth\n' +
[1]       '    };\n' +
[1]       '\n' +
[1]       '    if (config.socketPath) {\n' +
[1]       '      options.socketPath = config.socketPath;\n' +
[1]       '    } else {\n' +
[1]       '      options.hostname = parsed.hostname;\n' +
[1]       '      options.port = parsed.port;\n' +
[1]       '    }\n' +
[1]       '\n' +
[1]       '    var proxy = config.proxy;\n' +
[1]       '    if (!proxy && proxy !== false) {\n' +
[1]       "      var proxyEnv = protocol.slice(0, -1) + '_proxy';\n" +
[1]       '      var proxyUrl = process.env[proxyEnv] || process.env[proxyEnv.toUpperCase()];\n' +
[1]       '      if (proxyUrl) {\n' +
[1]       '        var parsedProxyUrl = url.parse(proxyUrl);\n' +
[1]       '        var noProxyEnv = process.env.no_proxy || process.env.NO_PROXY;\n' +
[1]       '        var shouldProxy = true;\n' +
[1]       '\n' +
[1]       '        if (noProxyEnv) {\n' +
[1]       "          var noProxy = noProxyEnv.split(',').map(function trim(s) {\n" +
[1]       '            return s.trim();\n' +
[1]       '          });\n' +
[1]       '\n' +
[1]       '          shouldProxy = !noProxy.some(function proxyMatch(proxyElement) {\n' +
[1]       '            if (!proxyElement) {\n' +
[1]       '              return false;\n' +
[1]       '            }\n' +
[1]       "            if (proxyElement === '*') {\n" +
[1]       '              return true;\n' +
[1]       '            }\n' +
[1]       "            if (proxyElement[0] === '.' &&\n" +
[1]       '                parsed.hostname.substr(parsed.hostname.length - proxyElement.length) === proxyElement) {\n' +
[1]       '              return true;\n' +
[1]       '            }\n' +
[1]       '\n' +
[1]       '            return parsed.hostname === proxyElement;\n' +
[1]       '          });\n' +
[1]       '        }\n' +
[1]       '\n' +
[1]       '\n' +
[1]       '        if (shouldProxy) {\n' +
[1]       '          proxy = {\n' +
[1]       '            host: parsedProxyUrl.hostname,\n' +
[1]       '            port: parsedProxyUrl.port\n' +
[1]       '          };\n' +
[1]       '\n' +
[1]       '          if (parsedProxyUrl.auth) {\n' +
[1]       "            var proxyUrlAuth = parsedProxyUrl.auth.split(':');\n" +
[1]       '            proxy.auth = {\n' +
[1]       '              username: proxyUrlAuth[0],\n' +
[1]       '              password: proxyUrlAuth[1]\n' +
[1]       '            };\n' +
[1]       '          }\n' +
[1]       '        }\n' +
[1]       '      }\n' +
[1]       '    }\n' +
[1]       '\n' +
[1]       '    if (proxy) {\n' +
[1]       '      options.hostname = proxy.host;\n' +
[1]       '      options.host = proxy.host;\n' +
[1]       "      options.headers.host = parsed.hostname + (parsed.port ? ':' + parsed.port : '');\n" +
[1]       '      options.port = proxy.port;\n' +
[1]       "      options.path = protocol + '//' + parsed.hostname + (parsed.port ? ':' + parsed.port : '') + options.path;\n" +
[1]       '\n' +
[1]       '      // Basic proxy authorization\n' +
[1]       '      if (proxy.auth) {\n' +
[1]       "        var base64 = Buffer.from(proxy.auth.username + ':' + proxy.auth.password, 'utf8').toString('base64');\n" +
[1]       "        options.headers['Proxy-Authorization'] = 'Basic ' + base64;\n" +
[1]       '      }\n' +
[1]       '    }\n' +
[1]       '\n' +
[1]       '    var transport;\n' +
[1]       '    var isHttpsProxy = isHttpsRequest && (proxy ? isHttps.test(proxy.protocol) : true);\n' +
[1]       '    if (config.transport) {\n' +
[1]       '      transport = config.transport;\n' +
[1]       '    } else if (config.maxRedirects === 0) {\n' +
[1]       '      transport = isHttpsProxy ? https : http;\n' +
[1]       '    } else {\n' +
[1]       '      if (config.maxRedirects) {\n' +
[1]       '        options.maxRedirects = config.maxRedirects;\n' +
[1]       '      }\n' +
[1]       '      transport = isHttpsProxy ? httpsFollow : httpFollow;\n' +
[1]       '    }\n' +
[1]       '\n' +
[1]       '    if (config.maxContentLength && config.maxContentLength > -1) {\n' +
[1]       '      options.maxBodyLength = config.maxContentLength;\n' +
[1]       '    }\n' +
[1]       '\n' +
[1]       '    // Create the request\n' +
[1]       '    var req = transport.request(options, function handleResponse(res) {\n' +
[1]       '      if (req.aborted) return;\n' +
[1]       '\n' +
[1]       '      // uncompress the response body transparently if required\n' +
[1]       '      var stream = res;\n' +
[1]       "      switch (res.headers['content-encoding']) {\n" +
[1]       '      /*eslint default-case:0*/\n' +
[1]       "      case 'gzip':\n" +
[1]       "      case 'compress':\n" +
[1]       "      case 'deflate':\n" +
[1]       '        // add the unzipper to the body stream processing pipeline\n' +
[1]       '        stream = (res.statusCode === 204) ? stream : stream.pipe(zlib.createUnzip());\n' +
[1]       '\n' +
[1]       '        // remove the content-encoding in order to not confuse downstream operations\n' +
[1]       "        delete res.headers['content-encoding'];\n" +
[1]       '        break;\n' +
[1]       '      }\n' +
[1]       '\n' +
[1]       '      // return the last request in case of redirects\n' +
[1]       '      var lastRequest = res.req || req;\n' +
[1]       '\n' +
[1]       '      var response = {\n' +
[1]       '        status: res.statusCode,\n' +
[1]       '        statusText: res.statusMessage,\n' +
[1]       '        headers: res.headers,\n' +
[1]       '        config: config,\n' +
[1]       '        request: lastRequest\n' +
[1]       '      };\n' +
[1]       '\n' +
[1]       "      if (config.responseType === 'stream') {\n" +
[1]       '        response.data = stream;\n' +
[1]       '        settle(resolve, reject, response);\n' +
[1]       '      } else {\n' +
[1]       '        var responseBuffer = [];\n' +
[1]       "        stream.on('data', function handleStreamData(chunk) {\n" +
[1]       '          responseBuffer.push(chunk);\n' +
[1]       '\n' +
[1]       '          // make sure the content length is not over the maxContentLength if specified\n' +
[1]       '          if (config.maxContentLength > -1 && Buffer.concat(responseBuffer).length > config.maxContentLength) {\n' +
[1]       '            stream.destroy();\n' +
[1]       "            reject(createError('maxContentLength size of ' + config.maxContentLength + ' exceeded',\n" +
[1]       '              config, null, lastRequest));\n' +
[1]       '          }\n' +
[1]       '        });\n' +
[1]       '\n' +
[1]       "        stream.on('error', function handleStreamError(err) {\n" +
[1]       '          if (req.aborted) return;\n' +
[1]       '          reject(enhanceError(err, config, null, lastRequest));\n' +
[1]       '        });\n' +
[1]       '\n' +
[1]       "        stream.on('end', function handleStreamEnd() {\n" +
[1]       '          var responseData = Buffer.concat(responseBuffer);\n' +
[1]       "          if (config.responseType !== 'arraybuffer') {\n" +
[1]       '            responseData = responseData.toString(config.responseEncoding);\n' +
[1]       '          }\n' +
[1]       '\n' +
[1]       '          response.data = responseData;\n' +
[1]       '          settle(resolve, reject, response);\n' +
[1]       '        });\n' +
[1]       '      }\n' +
[1]       '    });\n' +
[1]       '\n' +
[1]       '    // Handle errors\n' +
[1]       "    req.on('error', function handleRequestError(err) {\n" +
[1]       '      if (req.aborted) return;\n' +
[1]       '      reject(enhanceError(err, config, null, req));\n' +
[1]       '    });\n' +
[1]       '\n' +
[1]       '    // Handle request timeout\n' +
[1]       '    if (config.timeout) {\n' +
[1]       '      // Sometime, the response will be very slow, and does not respond, the connect event will be block by event loop system.\n' +
[1]       '      // And timer callback will be fired, and abort() will be invoked before connection, then get "socket hang up" and code ECONNRESET.\n' +
[1]       '      // At this time, if we have a large number of request, nodejs will hang up some socket on background. and the number will up and up.\n' +
[1]       '      // And then these socket which be hang up will devoring CPU little by little.\n' +
[1]       '      // ClientRequest.setTimeout will be fired on the specify milliseconds, and can make sure that abort() will be fired after connect.\n' +
[1]       '      req.setTimeout(config.timeout, function handleRequestTimeout() {\n' +
[1]       '        req.abort();\n' +
[1]       "        reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED', req));\n" +
[1]       '      });\n' +
[1]       '    }\n' +
[1]       '\n' +
[1]       '    if (config.cancelToken) {\n' +
[1]       '      // Handle cancellation\n' +
[1]       '      config.cancelToken.promise.then(function onCanceled(cancel) {\n' +
[1]       '        if (req.aborted) return;\n' +
[1]       '\n' +
[1]       '        req.abort();\n' +
[1]       '        reject(cancel);\n' +
[1]       '      });\n' +
[1]       '    }\n' +
[1]       '\n' +
[1]       '    // Send the request\n' +
[1]       '    if (utils.isStream(data)) {\n' +
[1]       "      data.on('error', function handleStreamError(err) {\n" +
[1]       '        reject(enhanceError(err, config, null, req));\n' +
[1]       '      }).pipe(req);\n' +
[1]       '    } else {\n' +
[1]       '      req.end(data);\n' +
[1]       '    }\n' +
[1]       '  });\n' +
[1]       '}',
[1]     xsrfCookieName: 'XSRF-TOKEN',
[1]     xsrfHeaderName: 'X-XSRF-TOKEN',
[1]     maxContentLength: -1,
[1]     validateStatus: '[function] function validateStatus(status) {\n' +
[1]       '    return status >= 200 && status < 300;\n' +
[1]       '  }'
[1]   }
[1] }
^C

```

mpower bahis normal works
```
[1] 14:40:06.541 › ------- || last sync time: 1653813549309.0 || ----------------
[1] {
[1]   status: 201,
[1]   date_created: '2022-05-29 08:40:07',
[1]   message: '<OpenRosaResponse xmlns="http://openrosa.org/http/response">\n' +
[1]     '    <message></message>\n' +
[1]     '    <submissionMetadata xmlns="http://www.opendatakit.org/xforms" id="staff"  instanceID="uuid:6d1822254a664961ba788af2bb627092" submissionDate="2022-05-29T08:40:07.173858+00:00" isComplete="true" markedAsCompleteDate="2022-05-29T08:40:07.173886+00:00"/>\n' +
[1]     '</OpenRosaResponse>\n',
[1]   id: 5534
```

 
2. filter not showing in list view



review of app db

1. table users, password unhashed
2. module image, has whole path to image_name but in source directiory.
3. medicine table has only one line synced

4. Lists defined in `lists` table
{"Bangla":"PATIENT LIST","English":"PATIENT LIST"}
{"config_json":"","query":"select * from bahis_patient_registrydyncsv_live_table","type":1}

5. geo_cluster contains only direct parents and all childer of current upazilla no lat/lon
6. geo contains all geo structure

7. `forms` is similar to lists. Thats were drop-down menues seem to be defined:
- form_name == "diagnosis"
- definition == 
{"name":"diagnosis","title":"Diagnosis","sms_keyword":"diagnosis","default_language":"English","id_string":"diagnosis","type":"survey","children":[{"type":"start","name":"start"},{"type":"end","name":"end"},{"type":"username","name":"username"},{"control":{"appearance":"search('species') minimal"},"name":"species","bind":{"required":"TRUE"},"label":{"Bangla":"Species Type","English":"Species Type"},"type":"select one","children":[{"name":"speciesid","label":{"Bangla":"speciesname","English":"speciesname"}}]},{"bind":{"required":"TRUE"},"type":"integer","name":"diagnosisid","label":{"Bangla":"Diagnosis ID","English":"Diagnosis ID"}},{"bind":{"required":"TRUE"},"type":"text","name":"diagnosisname","label":{"Bangla":"Diagnosis Name","English":"Diagnosis Name"}},{"control":{"bodyless":true},"type":"group","children":[{"bind":{"readonly":"true()","calculate":"concat('uuid:', uuid())"},"type":"calculate","name":"instanceID"}],"name":"meta"}]}
- choice_definition
{"species":{"config_json":{"datasource_title":"species","csv_name":"species","datasource_id":"128"},"query":"with p as (select \"speciesid\",\"speciesname\" from bahis_species_table ) select cast(p.speciesid as text) as \"speciesid\", cast(p.speciesname as text) as \"speciesname\" from p "}}

8. csv_syn_log has a list of last syncs in unix timeformat?

