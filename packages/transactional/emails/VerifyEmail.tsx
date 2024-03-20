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

type VerifyEmailProps = {
  url: string;
};

export const VerifyEmail = ({ url }: VerifyEmailProps) => {
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

        <Preview>pRESTige Email Verification</Preview>
        <Body>
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
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerifyEmail;
