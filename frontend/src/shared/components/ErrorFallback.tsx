function ErrorFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Algo salió mal
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Ocurrió un error inesperado. Intentá recargar la página.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Recargar página
        </button>
      </div>
    </div>
  )
}

export default ErrorFallback
