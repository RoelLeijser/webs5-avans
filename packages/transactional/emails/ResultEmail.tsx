import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";

type ResultEmailProps = {
  score: number;
  winner: {
    score: number;
  };
};

export const ResultEmail = ({ score, winner }: ResultEmailProps) => {
  return (
    <Html>
      <Tailwind>
        <Head>
          <Font
            fontFamily="Roboto"
            fallbackFontFamily="Verdana"
            webFont={{
              url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
              format: "woff2",
            }}
            fontWeight={400}
            fontStyle="normal"
          />
        </Head>

        <Preview>pRESTige Target Result</Preview>
        <Body>
          <Container className="bg-slate-100 p-5 rounded-md my-auto flex flex-col">
            <Text>
              The target has expired. The winner won with a score of{" "}
              {winner.score}.
            </Text>
            <Text>Your score was {score}!</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
