import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Html,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

type VerifyEmailProps = {
  url: string;
};

export const VerifyEmail = ({ url }: VerifyEmailProps) => {
  return (
    <Html>
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

      <Preview>pRESTige Email Verification</Preview>
      <Body>
        <Tailwind>
          <Container className="bg-slate-100 p-5 rounded-md my-auto">
            <Text>
              Please verify your email address by clicking the link below.
            </Text>
            <Button
              href={url}
              className="bg-black px-3 py-2 font-medium leading-4 text-white rounded-md"
            >
              Verify email
            </Button>
          </Container>
        </Tailwind>
      </Body>
    </Html>
  );
};

export default VerifyEmail;
