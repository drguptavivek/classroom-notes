import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Classroom Notes',
  description: 'How Classroom Notes handles teacher and student data.',
};

const CONTACT = 'drvivek.gupta@gmail.com';

function H2({ children }: { children: string }) {
  return <h2 className="eyebrow">{children}</h2>;
}

export default function PrivacyPolicy() {
  return (
    <main className="landing">
      <header>
        <a className="brand" href="/">
          <span className="mark">n</span>classroom<span className="light">notes</span>
        </a>
        <nav className="headeractions">
          <a className="button quiet" href="/">Back to app</a>
          <a className="button quiet" href="/terms">Terms of Service</a>
        </nav>
      </header>
      <section className="intro">
        <div className="eyebrow">PRIVACY POLICY</div>
        <h1>What we collect, and why</h1>
        <p className="muted">Last updated: 12 October 2026</p>
      </section>
      <section className="card">
        <H2>Summary</H2>
        <p>
          Classroom Notes is a tool for teachers to run classroom exercises.
          Students join with a code and never create an account. Teachers sign
          in with Google. We collect the minimum data needed to run the
          service, we do not sell it, and we do not run advertising or
          third-party analytics.
        </p>

        <H2>Who this applies to</H2>
        <p>
          <strong>Teachers</strong> create exercises and sign in with a Google
          account. <strong>Students</strong> respond to exercises anonymously —
          no name, e-mail address or account is required, and no student
          sign-in exists.
        </p>

        <H2>Data we collect</H2>
        <p>
          <strong>Teacher account data.</strong> When a teacher signs in with
          Google we receive and store their Google account identifier, name and
          e-mail address. This identifies who owns each exercise.
        </p>
        <p>
          <strong>Exercise content.</strong> Exercise titles, questions and
          settings created by teachers.
        </p>
        <p>
          <strong>Student responses.</strong> Answers submitted for an
          exercise. Each submission carries a random identifier generated in
          the student&apos;s browser so a submission can only be recognised as
          a duplicate of itself. We do not collect student names, e-mail
          addresses, account credentials or precise location.
        </p>
        <p>
          <strong>Question images.</strong> Images a teacher uploads to a
          question.
        </p>
        <p>
          <strong>Session cookie.</strong> A strictly necessary, signed cookie
          that keeps a teacher signed in. It contains no student data.
        </p>

        <H2>Where data is stored</H2>
        <p>
          Data is stored in a managed Turso/libsql database (located in the
          ap-south-1 region, Singapore) and on the service operator&apos;s
          virtual private server that hosts the application and uploaded
          images.
        </p>

        <H2>How data is used</H2>
        <p>
          Teacher data is used to authenticate teachers and associate
          exercises with their account. Exercise content and student responses
          are used only to run the exercise and show results to the exercise&apos;s
          teacher. We do not use student responses to profile anyone or to
          train machine-learning models.
        </p>

        <H2>AI analysis</H2>
        <p>
          The service offers two optional analysis features, both triggered
          only by a teacher: (1) a copy-and-open handoff that pastes exercise
          responses into ChatGPT under the teacher&apos;s own ChatGPT account and
          terms; and (2) optional embedded analysis that sends anonymised
          response text to the OpenAI API to produce a summary. Student
          responses are processed this way only when a teacher chooses to
          analyse an exercise. Teachers should review their school&apos;s or
          institution&apos;s policies before analysing student work with AI tools.
        </p>

        <H2>Sharing</H2>
        <p>
          We do not sell or share personal data with advertisers, data
          brokers or analytics providers. Data is shared with service
          providers only as needed to operate the service: Google
          (authentication), Turso (database hosting), and the VPS provider
          that hosts the application.
        </p>

        <H2>Retention and deletion</H2>
        <p>
          Teachers can delete an exercise, which permanently removes the
          exercise, its responses and any stored analysis. Teachers can clear
          responses while keeping the exercise. If you want your account and
          all associated data deleted entirely, e-mail {CONTACT} and we will
          delete it. Students who want a response removed should contact their
          teacher, who can clear the exercise&apos;s responses.
        </p>

        <H2>Cookies</H2>
        <p>
          We set one strictly necessary cookie for teacher sign-in, and a
          short-lived cookie during the sign-in flow to prevent request
          forgery. No advertising, tracking or analytics cookies are used.
        </p>

        <H2>Children&apos;s privacy</H2>
        <p>
          The service is intended for classroom use under a teacher&apos;s
          supervision. Students are not asked for personal information and do
          not have accounts. Teachers are responsible for the suitability of
          the content they collect.
        </p>

        <H2>Security</H2>
        <p>
          Traffic is encrypted in transit (HTTPS). Teacher sessions use
          signed, HTTP-only cookies. Exercise responses are private to the
          exercise&apos;s teacher until the teacher chooses to reveal them to the
          class.
        </p>

        <H2>Changes and contact</H2>
        <p>
          Material changes to this policy will be reflected on this page with
          an updated date. Questions, deletion requests and privacy concerns:
          {CONTACT}.
        </p>
      </section>
    </main>
  );
}
