import React, { useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import CalendarStripLib, { IDayComponentProps } from 'react-native-calendar-strip';
import moment, { Moment, isDuration } from 'moment';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import Svg, { Circle } from 'react-native-svg';

interface CalendarStripProps {
  selectedDate: Moment;
  onDateSelected: (date: Moment) => void;
  minDate: Moment;
  maxDate: Moment;
  onCalendarEndReached: (end: 'left' | 'right') => void;
  dailyCalorieGoal?: number;
}

interface DayCalorieProgress {
  totalCalories: number;
  remainingCalories: number;
  burnedCalories: number;
}

// Helper function to safely convert to a moment object
const safelyCreateMoment = (date: any): Moment => {
  if (moment.isMoment(date)) return date;
  if (isDuration(date)) return moment(); // Return current date for Duration objects
  
  try {
    return moment(date);
  } catch (e) {
    console.warn('Failed to parse date', e);
    return moment();
  }
};

const DayComponent = ({ 
  date, 
  calorieData, 
  dailyCalorieGoal,
  isSelected,
  isToday,
  onDateSelected
}: { 
  date: any, // Using any to accommodate the library's date type
  calorieData?: Record<string, DayCalorieProgress>,
  dailyCalorieGoal: number,
  isSelected?: boolean,
  isToday: boolean,
  onDateSelected: (date: Moment) => void
}) => {
  // Safely convert to moment object
  const momentDate = useMemo(() => safelyCreateMoment(date), [date]);
  const dateStr = momentDate.format('YYYY-MM-DD');
  const dayData = calorieData?.[dateStr];
  
  const progress = useMemo(() => {
    if (!dayData) return 0;
    const { totalCalories, remainingCalories, burnedCalories } = dayData;
    const adjustedGoal = dailyCalorieGoal + burnedCalories;
    const consumedCalories = totalCalories;
    return adjustedGoal > 0 ? (consumedCalories / adjustedGoal) * 100 : 0;
  }, [dayData, dailyCalorieGoal]);

  const isOverGoal = dayData?.remainingCalories ? dayData.remainingCalories < 0 : false;
  
  const radius = 16;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;

  const handlePress = () => {
    onDateSelected(momentDate);
  };

  return (
    <TouchableOpacity 
      style={styles.dayContainer}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.dayName,
        isToday && styles.todayText
      ]}>
        {momentDate.format('ddd')}
      </Text>
      <View style={styles.dateContainer}>
        <Svg width={radius * 2 + strokeWidth * 2} height={radius * 2 + strokeWidth * 2}>
          {(dayData || isToday) && (
            <Circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              stroke={dayData ? (isOverGoal ? "#FF4B4B" : "#4CAF50") : "black"}
              strokeWidth={strokeWidth}
              fill={isSelected ? "black" : "transparent"}
              strokeDasharray={dayData ? `${circumference} ${circumference}` : undefined}
              strokeDashoffset={dayData ? progressOffset : undefined}
              transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
            />
          )}
          <Circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius - strokeWidth / 2}
            fill={isSelected ? "black" : "transparent"}
          />
        </Svg>
        <View style={styles.dateNumberContainer}>
          <Text style={[
            styles.dateNumberText,
            isToday && styles.todayText,
            isSelected && styles.selectedDateText
          ]}>
            {momentDate.format('D')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const CalendarStrip: React.FC<CalendarStripProps> = ({
  selectedDate,
  onDateSelected,
  minDate,
  maxDate,
  onCalendarEndReached,
  dailyCalorieGoal = 2000,
}) => {
  const { data: calorieData } = useQuery({
    queryKey: ['meals-summary', minDate, maxDate],
    queryFn: async () => {
      const data = await api.meals.getMealsByDateRange(
        minDate.format('YYYY-MM-DD'),
        maxDate.format('YYYY-MM-DD')
      );
      return data as Record<string, DayCalorieProgress>;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  // Create a stable reference to today's date string
  const todayStr = useMemo(() => moment().format('YYYY-MM-DD'), []);

  return (
    <CalendarStripLib
      calendarAnimation={{ type: "sequence", duration: 30 }}
      style={styles.calendar}
      calendarHeaderStyle={{ display: "none" }}
      styleWeekend={false}
      selectedDate={selectedDate}
      onDateSelected={onDateSelected}
      useNativeDriver={true}
      scrollable={true}
      dayComponentHeight={80}
      leftSelector={<View />}
      rightSelector={<View />}
      minDate={minDate}
      maxDate={maxDate}
      scrollerPaging={true}
      scrollToOnSetSelectedDate={false}
      updateWeek={true}
      dayComponent={(props: IDayComponentProps) => (
        <DayComponent
          date={props.date}
          calorieData={calorieData}
          dailyCalorieGoal={dailyCalorieGoal}
          isSelected={props.selected}
          isToday={safelyCreateMoment(props.date).format('YYYY-MM-DD') === todayStr}
          onDateSelected={onDateSelected}
        />
      )}
      onWeekScrollEnd={(start, end) => {
        if (!start || !end) return;
        
        try {
          const startMoment = safelyCreateMoment(start);
          const endMoment = safelyCreateMoment(end);
          
          if (startMoment.isSame(minDate, 'day')) {
            onCalendarEndReached('left');
          } else if (endMoment.isSame(maxDate, 'day')) {
            onCalendarEndReached('right');
          }
        } catch (e) {
          console.warn('Failed to process week scroll end', e);
        }
      }}
    />
  );
};

const styles = StyleSheet.create({
  calendar: {
    height: 90,
    paddingTop: 10,
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  dayName: {
    color: "#666666",
    fontSize: 12,
    marginBottom: 4,
  },
  dateContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumberContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumberText: {
    color: "#666666",
    fontSize: 16,
  },
  selectedDateText: {
    color: 'white',
  },
  todayText: {
    color: 'black',
    fontWeight: '600',
  },
}); 