import React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
} from '@react-email/components';

interface WorkspaceInviteEmailProps {
  inviteUrl: string;
  workspaceName: string;
}

const WorkspaceInviteEmail: React.FC<WorkspaceInviteEmailProps> = ({
  inviteUrl,
  workspaceName,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Join our workspace on ezytodo</Preview>
      <Body className="bg-gray-100 font-sans">
        <Container className="bg-white border border-gray-200 rounded-lg p-6 max-w-xl mx-auto my-10">
          <Section>
            <Text className="text-2xl font-bold mb-4 text-gray-800">
              You're Invited to Join ${workspaceName}
            </Text>
            <Text className="text-gray-600 mb-4">
              We are excited to invite you to join our workspace on ezytodo.
              It's a great place to collaborate and manage your tasks
              efficiently.
            </Text>
            <Text className="text-gray-600 mb-6">
              Click the link below to accept the invitation and get started:
            </Text>
            <Button
              className="bg-blue-600 text-white rounded-md font-semibold text-lg hover:bg-blue-500 focus:bg-blue-700 focus:outline-none px-5 py-3"
              href={inviteUrl}
            >
              Join Workspace
            </Button>
            <Text className="text-gray-500 mt-6">
              If you didn’t expect this invitation, feel free to ignore this
              email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WorkspaceInviteEmail;
