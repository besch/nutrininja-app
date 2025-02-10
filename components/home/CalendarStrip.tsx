import React from 'react';
import { View, StyleSheet } from 'react-native';
import CalendarStripLib from 'react-native-calendar-strip';
import moment, { Moment } from 'moment';

interface CalendarStripProps {
  selectedDate: Moment;
  onDateSelected: (date: Moment) => void;
  minDate: Moment;
  maxDate: Moment;
  onCalendarEndReached: (end: 'left' | 'right') => void;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({
  selectedDate,
  onDateSelected,
  minDate,
  maxDate,
  onCalendarEndReached,
}) => {
  return (
    <CalendarStripLib
      calendarAnimation={{ type: "sequence", duration: 30 }}
      daySelectionAnimation={{
        type: "border",
        duration: 200,
        borderWidth: 0,
        borderHighlightColor: "transparent",
      }}
      style={styles.calendar}
      calendarHeaderStyle={{ display: "none" }}
      dateNumberStyle={{ 
        color: "#666666", 
        fontSize: 16,
        width: 32,
        height: 32,
        textAlign: "center",
        lineHeight: 32,
      }}
      dateNameStyle={{ 
        color: "#666666", 
        fontSize: 12,
        marginTop: 4
      }}
      highlightDateNumberStyle={{
        color: "white",
        backgroundColor: "black",
        width: 32,
        height: 32,
        textAlign: "center",
        lineHeight: 32,
        borderRadius: 16,
        overflow: "hidden",
        fontSize: 16,
      }}
      highlightDateNameStyle={{ 
        color: "#666666", 
        fontSize: 12,
        marginTop: 4
      }}
      styleWeekend={false}
      customDatesStyles={[
        {
          date: moment(),
          dateNumberStyle: {
            color: "#666666",
            fontSize: 16,
            width: 32,
            height: 32,
            textAlign: "center",
            lineHeight: 32,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "black",
            overflow: "hidden",
          },
        },
      ]}
      selectedDate={selectedDate}
      onDateSelected={onDateSelected}
      useNativeDriver={true}
      scrollable={true}
      dayComponentHeight={60}
      leftSelector={<View />}
      rightSelector={<View />}
      minDate={minDate}
      maxDate={maxDate}
      showDayName={true}
      showDayNumber={true}
      scrollerPaging={true}
      startingDate={moment().subtract(3, "days")}
      scrollToOnSetSelectedDate={false}
      updateWeek={true}
      onWeekScrollEnd={(start, end) => {
        if (moment(start).isSame(minDate, 'day')) {
          onCalendarEndReached('left');
        } else if (moment(end).isSame(maxDate, 'day')) {
          onCalendarEndReached('right');
        }
      }}
    />
  );
};

const styles = StyleSheet.create({
  calendar: {
    height: 90,
  },
}); 