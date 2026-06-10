import { SeoArticle, articleStyles } from '@/src/components/web/SeoArticle';
import { H2, P } from '@expo/html-elements';
import React from 'react';

export default function WhatIsPomodoroPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to use the Pomodoro Technique',
    description: 'A simple step-by-step guide to the Pomodoro Technique for focused, sustainable work.',
    totalTime: 'PT2H',
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Choose one task', text: 'Pick a single task to focus on and remove obvious distractions.' },
      { '@type': 'HowToStep', position: 2, name: 'Set a 25-minute timer', text: 'Start a 25-minute Pomodoro and work only on that task until it ends.' },
      { '@type': 'HowToStep', position: 3, name: 'Take a 5-minute break', text: 'When the timer rings, rest for five minutes away from the screen.' },
      { '@type': 'HowToStep', position: 4, name: 'Repeat and take a long break', text: 'After four Pomodoros, take a longer 15-minute break, then begin again.' },
    ],
  };

  return (
    <SeoArticle
      path="/what-is-pomodoro-technique"
      title="What Is the Pomodoro Technique? A Simple Guide | Flowglass"
      description="Learn the Pomodoro Technique: a simple 25/5 method for focused, sustainable work. Includes a free timer you can start right now."
      h1="What Is the Pomodoro Technique?"
      intro="A simple, proven method for focused work in 25-minute sprints. Learn how it works, then try it with the free timer below."
      timerMinutes={25}
      jsonLd={jsonLd}
      related={[
        { href: '/pomodoro-timer', label: 'Free Pomodoro Timer' },
        { href: '/focus-timer-for-students', label: 'Focus Timer for Students' },
      ]}
    >
      <H2 style={articleStyles.h2}>The origin of the Pomodoro Technique</H2>
      <P style={articleStyles.p}>
        The Pomodoro Technique was created by Francesco Cirillo in the late 1980s. As a student, he struggled to focus, so he made a
        deal with himself: just ten minutes of real concentration. He grabbed a tomato-shaped kitchen timer — “pomodoro” is Italian
        for tomato — and the method was born. The core idea is timeless: commit to a short, fixed interval of single-tasking, then rest.
      </P>

      <H2 style={articleStyles.h2}>How the technique works</H2>
      <P style={articleStyles.p}>
        The classic cycle is 25 minutes of focused work followed by a 5-minute break — one Pomodoro. After four Pomodoros you take a
        longer break of around 15 minutes. During a Pomodoro you do one thing only. If a distraction pops into your head, you jot it
        down and return to the task. The timer, not your willpower, decides when you stop.
      </P>
      <P style={articleStyles.p}>
        This structure works for two reasons. First, a short commitment is easy to start, which defeats procrastination. Second, the
        regular breaks prevent the mental fatigue that makes long sessions unravel. You end the day having done focused work instead of
        merely having been busy.
      </P>

      <H2 style={articleStyles.h2}>Try it now with Flowglass</H2>
      <P style={articleStyles.p}>
        The timer at the top of this page is a real, working Pomodoro timer — press start and you have begun. Flowglass automates the
        full rhythm, including the long break after your fourth Pomodoro, and quietly logs your focused time so you can see your effort
        add up. It is free, requires no account, and works on the web, iOS, and Android. When you want longer sessions, explore the deep
        work timer; if 25 minutes feels like too much today, the ADHD-friendly page covers shorter, custom blocks.
      </P>
    </SeoArticle>
  );
}
