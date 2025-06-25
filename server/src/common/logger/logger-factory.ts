import path from "path";
import pino from "pino";

export const createLogger = (fileName: string) => {
  const transport = pino.transport({
    targets: [
      {
        level: 'info',
        target: 'pino/file',
        options: {
            destination: path.join(process.cwd(), fileName + '.log'),
        },
      },
      {
        level: "info",
        target: "pino-pretty",
        options: {},
      },
    ],
  });

  return pino(
    {
      base: undefined,
      timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
    },
    transport,
  );
};

