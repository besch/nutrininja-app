import React from 'react';
import { View } from 'react-native';
import { IconNames } from '@/types';
import { SvgProps } from 'react-native-svg';
import RunIcon from '@/assets/images/svg/run.svg';
import BikeIcon from '@/assets/images/svg/bike.svg';
import SwimIcon from '@/assets/images/svg/swim.svg';
import StairsIcon from '@/assets/images/svg/stairs.svg';
import DumbbellIcon from '@/assets/images/svg/dumbbell.svg';
import WeightliftingIcon from '@/assets/images/svg/weightlifting.svg';
import StretchingIcon from '@/assets/images/svg/stretching.svg';
import FitnessIcon from '@/assets/images/svg/fitness.svg';
import TimerIcon from '@/assets/images/svg/timer.svg';
import BallIcon from '@/assets/images/svg/ball.svg';
import BasketballIcon from '@/assets/images/svg/basketball.svg';
import TennisIcon from '@/assets/images/svg/tennis.svg';
import SoccerIcon from '@/assets/images/svg/soccer.svg';
import VolleyballIcon from '@/assets/images/svg/volleyball.svg';
import TreeIcon from '@/assets/images/svg/tree.svg';
import HikingIcon from '@/assets/images/svg/hiking.svg';
import ClimbingIcon from '@/assets/images/svg/climbing.svg';
import KayakIcon from '@/assets/images/svg/kayak.svg';
import SkiIcon from '@/assets/images/svg/ski.svg';

interface ActivityIconProps {
  name: IconNames;
  size?: number;
  color?: string;
  style?: SvgProps['style'];
}

export default function ActivityIcon({ name, size = 24, color = '#000', style }: ActivityIconProps) {
  const renderIcon = () => {
    const props = {
      width: String(size),
      height: String(size),
      fill: color,
      style
    };

    switch (name) {
      case IconNames.run:
        return <RunIcon {...props} />;
      case IconNames.bike:
        return <BikeIcon {...props} />;
      case IconNames.swim:
        return <SwimIcon {...props} />;
      case IconNames.stairs:
        return <StairsIcon {...props} />;
      case IconNames.dumbbell:
        return <DumbbellIcon {...props} />;
      case IconNames.weightlifting:
        return <WeightliftingIcon {...props} />;
      case IconNames.stretching:
        return <StretchingIcon {...props} />;
      case IconNames.fitness:
        return <FitnessIcon {...props} />;
      case IconNames.timer:
        return <TimerIcon {...props} />;
      case IconNames.ball:
        return <BallIcon {...props} />;
      case IconNames.basketball:
        return <BasketballIcon {...props} />;
      case IconNames.tennis:
        return <TennisIcon {...props} />;
      case IconNames.soccer:
        return <SoccerIcon {...props} />;
      case IconNames.volleyball:
        return <VolleyballIcon {...props} />;
      case IconNames.tree:
        return <TreeIcon {...props} />;
      case IconNames.hiking:
        return <HikingIcon {...props} />;
      case IconNames.climbing:
        return <ClimbingIcon {...props} />;
      case IconNames.kayak:
        return <KayakIcon {...props} />;
      case IconNames.ski:
        return <SkiIcon {...props} />;
      default:
        console.warn(`Icon not found for name: ${name}`);
        return null;
    }
  };

  return renderIcon();
} 