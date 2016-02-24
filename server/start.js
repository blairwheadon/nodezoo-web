'use strict'

var HOST = process.env.HOST || 'localhost'
var PORT = process.env.PORT || 8000

// Our hapi server bits
var Chairo = require('chairo')
var Hapi = require('hapi')
var Inert = require('inert')
var Path = require('path')

// Our server routes
var ClientRoutes = require('./routes/client')
var ApiRoutes = require('./routes/api')

var opts = {
  vidi_metrics: {
    emitter: {
      enabled: true
    }
  },
  seneca_metrics: {
    group: 'nodezoo',
    tag: 'nodezoo-web',
    pins: [
      'role:info,cmd:get',
      'role:search,cmd:search'
    ]
  }
}


function endIfErr (err) {
  if (err) {
    console.error(err)
    process.exit(1)
  }
}

var server = new Hapi.Server()
server.connection({port: PORT})

var plugins = [
  Chairo,
  Inert
]

server.register(plugins, function (err) {
  endIfErr(err)

  var relativePath = Path.join(__dirname, '../dist/')
  server.realm.settings.files.relativeTo = relativePath

  server.route(ClientRoutes)
  server.route(ApiRoutes)

  var seneca = server.seneca

  seneca.use('mesh', {auto: true})
  seneca.use('vidi-metrics', opts.vidi_metrics)
  seneca.use('vidi-seneca-metrics', opts.seneca_metrics)

  seneca.ready(function () {
    seneca.log.info('hapi', server.info)
    server.start(endIfErr)
  })
})