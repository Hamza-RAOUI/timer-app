import { SeoArticle, articleStyles } from '@/src/components/web/SeoArticle';
import { H2, P } from '@expo/html-elements';
import React from 'react';

export default function DeepWorkTimerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is a deep work timer?',
        acceptedAnswer: { '@type': 'Answer', text: 'A deep work timer protects a long, uninterrupted block — often 50 to 90 minutes — for cognitively demanding work, followed by a real recovery break.' },
      },
      {
        '@type': 'Question',
        name: 'How long should a deep work session be?',
        acceptedAnswer: { '@type': 'Answer', text: 'Common choices are 50/10 and 90/20. Flowglass includes a 52/17 method and a fully custom option so you can match your own attention span.' },
      },
    ],
  };

  return (
    <SeoArticle
      path="/deep-work-timer"
      title="Deep Work Timer — Free 50/90 Minute Focus | Flowglass"
      description="A free deep work timer for long, uninterrupted focus. Use 52/17 or set a custom 50 or 90 minute block, then track your deep hours."
      h1="Deep Work Timer"
      intro="Protect a long, uninterrupted block for your most demanding work. Start a deep session below or set your own length."
      timerMinutes={50}
      jsonLd={jsonLd}
      related={[
        { href: '/pomodoro-timer', label: 'Free Pomodoro Timer' },
        { href: '/focus-timer-for-students', label: 'Focus Timer for Students' },
      ]}
    >
      <H2 style={articleStyles.h2}>What deep work really needs</H2>
      <P style={articleStyles.p}>
        Deep work is the focused, undistracted effort that produces your best thinking — writing, coding, designing, problem solving.
        It cannot be rushed in five-minute gaps between notifications. It needs a protected block long enough to load the problem fully
        into your mind and stay there. A deep work timer guards that block: you decide the length, press start, and treat the session
        as non-negotiable until the time is up.
      </P>
      <P style={articleStyles.p}>
        Flowglass keeps the interface quiet so nothing competes with the work. The draining hourglass gives you an ambient sense of
        time without a distracting clock, and there is no feed, no badges, and no noise.
      </P>

      <H2 style={articleStyles.h2}>52/17, 50/10, or 90/20?</H2>
      <P style={articleStyles.p}>
        There is no single correct length. The well-known 52/17 rhythm — 52 minutes on, 17 off — balances intensity and recovery for
        many knowledge workers, and it is built into Flowglass. Others prefer 50/10 or a single 90-minute block aligned to the body’s
        natural ultradian rhythm. With the Custom technique you can set any work and break length and save it as a preset.
      </P>
      <P style={articleStyles.p}>
        Whatever you choose, the break is part of the method, not a reward to skip. A genuine pause — away from screens — is what lets
        the next deep block be just as productive.
      </P>

      <H2 style={articleStyles.h2}>See your deep hours add up</H2>
      <P style={articleStyles.p}>
        Every session you finish is logged by category, so your deep work hours accumulate into a weekly picture you can trust. Over
        time, protecting even one or two deep blocks a day compounds into serious output. Start a deep session above, and if you are
        new to structured focus, read what the Pomodoro Technique is first.
      </P>
    </SeoArticle>
  );
}
