class FetchError extends Error {
  constructor (message, type, systemError) {
    super(message)
    this.type = type
    if (systemError) {
      this.code = this.errno = systemError.code
    }
  }

  get name () {
    return 'FetchError'
  }

  get [Symbol.toStringTag] () {
    return 'FetchError'
  }
}

const errors = {
  Error: FetchError,
  TypeError
}

function deserializeError (name, init) {
  const constructor = errors[name] ?? FetchError
  const cause = init.pop()
  const error = new constructor(...init)

  if (cause) {
    error.cause = deserializeError(...cause)
  }

  return error
}

module.exports = { FetchError, deserializeError }
