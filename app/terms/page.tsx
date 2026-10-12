import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Classroom Notes',
  description: 'The rules for using Classroom Notes.',
};

const CONTACT = 'drvivek.gupta@gmail.com';

function H2({ children }: { children: string }) {
  return <h2 className="eyebrow">{children}</h2>;
}

export default function Terms() {
  return (
    <main className="landing">
      <header>
        <a className="brand" href="/">
          <span className="mark">n</span>classroom<span className="light">notes</span>
        </a>
        <nav className="headeractions">
          <a className="button quiet" href="/">Back to app</a>
          <a className="button quiet" href="/privacy">Privacy Policy</a>
        </nav>
      </header>
      <section className="intro">
        <div className="eyebrow">TERMS OF SERVICE</div>
        <h1>The rules for using Classroom Notes</h1>
        <p className="muted">Last updated: 12 October 2026</p>
      </section>
      <section className="card">
        <H2>Acceptance</H2>
        <p>
          By using Classroom Notes you agree to these terms. If you use the
          service on behalf of a school or other institution, you confirm you
          are authorised to do so.
        </p>

        <H2>The service</H2>
        <p>
          Classroom Notes lets a teacher create classroom exercises, share
          them with students via a code or QR link, collect anonymous
          responses, and review the results. Students do not create accounts.
        </p>

        <H2>Accounts</H2>
        <p>
          Teachers sign in with a Google account. You are responsible for
          keeping your Google account secure and for all activity under your
          sign-in. Each teacher&apos;s exercises are private to that teacher.
        </p>

        <H2>Acceptable use</H2>
        <p>You agree not to:</p>
        <p>
          use the service to collect sensitive personal data from students
          beyond what classroom work requires; upload unlawful, infringing or
          malicious content; attempt to access other teachers&apos; exercises or
          data; disrupt or probe the service&apos;s infrastructure; use the
          service to harass anyone. We may suspend access for violations.
        </p>

        <H2>Student consent and school policies</H2>
        <p>
          Teachers are responsible for obtaining any consents required by
          their institution and applicable law before collecting student
          responses, and for complying with their school&apos;s policies —
          including policies on AI-assisted analysis of student work.
        </p>

        <H2>Your content</H2>
        <p>
          Teachers own the exercises and responses they create. By using the
          service you grant the operator only the limited right to store and
          process that content as needed to provide the service. We may
          delete data associated with an account at the account holder&apos;s
          request.
        </p>

        <H2>Availability</H2>
        <p>
          The service is provided as-is, without warranty of any kind, and
          without a guaranteed uptime. We may change or discontinue features.
          Do not rely on the service as the sole store of important work —
          export your data when it matters.
        </p>

        <H2>AI analysis</H2>
        <p>
          Analysis features are optional and teacher-initiated. AI-generated
          summaries can contain errors and must not be treated as authoritative
          assessments of students.
        </p>

        <H2>Limitation of liability</H2>
        <p>
          To the maximum extent permitted by law, the operator is not liable
          for indirect, incidental or consequential damages, or for loss of
          data, profits or goodwill arising from use of the service.
        </p>

        <H2>Termination</H2>
        <p>
          You may stop using the service at any time; request deletion of your
          data by e-mailing {CONTACT}. We may suspend or terminate access for
          breach of these terms.
        </p>

        <H2>Changes and contact</H2>
        <p>
          These terms may be updated; continued use after a change constitutes
          acceptance. Questions: {CONTACT}.
        </p>
      </section>
    </main>
  );
}
