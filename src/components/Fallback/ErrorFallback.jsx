import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router-dom';

function ErrorFallback() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = 'Oops! Something went wrong.';
  let message = 'We\'re sorry for the inconvenience. Our team has been notified.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Page Not Found';
      message = 'The page you are looking for does not exist.';
    } else {
      title = `Error ${error.status}`;
      message = error.statusText;
    }
  }

  const goHome = () => navigate('/');

  const retry = () => navigate(0);  

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4 font-sans text-slate-800"
      role="alert"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-xl md:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-10 w-10 text-red-600"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 15.75a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25zM12 12.75a.75.75 0 00-.75-.75h-.01a.75.75 0 000 1.5h.01a.75.75 0 00.75-.75z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>

        <p className="mt-4 text-base text-slate-600">
          {message}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <button onClick={retry} className="...">Try Again</button>
          <button onClick={goHome} className="...">Go to Homepage</button>
        </div>

        {process.env.NODE_ENV === 'development' && !isRouteErrorResponse(error) && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700">
              Show Error Details
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-slate-50 p-4 text-sm text-red-600">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default ErrorFallback;