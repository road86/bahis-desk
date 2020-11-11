import React from 'react';

export default class ErrorBoundary extends React.Component<any, any> {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }
  
    static getDerivedStateFromError(error: any) {
        console.log(error);
      // Update state so the next render will show the fallback UI.
      return { hasError: true };
    }
  
    componentDidCatch(error: any, errorInfo: any) {
      // You can also log the error to an error reporting service
      //logErrorToMyService(error, errorInfo);
      console.log("component did catch the error ", error, errorInfo);
    }

    componentWillUnmount() {
        console.log(this.state.hasError);
    }
  
    render() {
      if (this.state.hasError) {
        // You can render any custom fallback UI
        return <h1>Something went wrong.</h1>;
      }
      else {
          console.log('check', this.state)
        return this.props.children;
      }
       
    }
  }