import { SeoArticle, articleStyles } from '@/src/components/web/SeoArticle';
import { H2, P } from '@expo/html-elements';
import React from 'react';

export default function PomodoroTimerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is the Flowglass Pomodoro timer free?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes. Flowglass is completely free, runs in your browser with no login or download, and also works on iOS and Android.' },
      },
      {
        '@type': 'Question',
        name: 'How long is a Pomodoro?',
        acceptedAnswer: { '@type': 'Answer', text: 'A classic Pomodoro is 25 minutes of focused work followed by a 5-minute break. After four Pomodoros you take a longer 15-minute break.' },
      },
      {
        '@type': 'Question',
        name: 'Can I use the Pomodoro timer online without installing anything?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes. The timer on this page is the real Flowglass app — press start and it runs instantly in your browser.' },
      },
    ],
  };

  return (
    <SeoArticle
      path="/pomodoro-timer"
      title="Free Pomodoro Timer Online — Flowglass"
      description="A free online Pomodoro timer. No login, no download. Start a 25/5 focus cycle in your browser on any device with Flowglass."
      h1="Free Pomodoro Timer Online"
      intro="Start a focused 25-minute session right now — no sign-up, no install. The Pomodoro timer below is the real Flowglass app running in your browser."
      timerMinutes={25}
      jsonLd={jsonLd}
      related={[
        { href: '/what-is-pomodoro-technique', label: 'What is the Pomodoro Technique?' },
        { href: '/deep-work-timer', label: 'Deep Work Timer' },
      ]}
    >
      <H2 style={articleStyles.h2}>What is a Pomodoro timer?</H2>
      <P style={articleStyles.p}>
        A Pomodoro timer breaks your work into short, focused intervals — traditionally 25 minutes — separated by brief breaks.
        Each interval is called a “Pomodoro.” The method works because a fixed, visible countdown turns a vague, open-ended task
        into a small commitment you can actually start. Instead of “write the report,” the job becomes “focus for 25 minutes,”
        which is far easier for your brain to accept.
      </P>
      <P style={articleStyles.p}>
        Flowglass shows the time as a calm draining hourglass alongside the digits, so you can feel your session progressing
        without staring at the numbers. When the sand runs out, you take a short break and start the next round.
      </P>

      <H2 style={articleStyles.h2}>How to use the 25/5 method</H2>
      <P style={articleStyles.p}>
        Pick one task. Press start and work on only that task for 25 minutes — no email, no messages, no switching tabs. When the
        timer ends, take a 5-minute break: stand up, stretch, look away from the screen. After four focus blocks, take a longer
        15-minute break. Flowglass handles this rhythm automatically, including the long break after your fourth Pomodoro.
      </P>
      <P style={articleStyles.p}>
        The breaks are not optional extras — they are what make the technique sustainable. Stepping away lets your attention
        recover so the next sprint is just as sharp as the first. Most people find three to six quality Pomodoros a day is worth
        more than eight distracted hours.
      </P>

      <H2 style={articleStyles.h2}>Why use Flowglass instead of a kitchen timer?</H2>
      <P style={articleStyles.p}>
        Flowglass remembers your sessions and rolls them up into clean statistics by category — Study, Work, Hobby, and Personal —
        so you can see where your focused hours actually go each week. It is free, needs no account, and the very same timer runs on
        the web, your phone, and soon your Windows desktop. Start a Pomodoro above, then explore the other focus methods when you are ready.
      </P>
    </SeoArticle>
  );
}
