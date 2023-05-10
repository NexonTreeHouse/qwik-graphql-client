import { Slot } from "@builder.io/qwik";

export default () => {
  return (
    <>
      <head>
        <meta charSet="utf-8" />
        <title>Qwik Blank App</title>
      </head>
      <body>
        <Slot></Slot>
      </body>
    </>
  );
};
