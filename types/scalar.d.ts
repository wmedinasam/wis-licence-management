declare global {
  interface Window {
    Scalar?: {
      createApiReference: (
        element: Element,
        configuration: {
          url: string;
          theme: 'deepSpace';
        },
      ) => {
        destroy: () => void;
      };
    };
  }
}

export {};
