import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  HStack,
  Button,
  useColorModeValue,
  Select
} from '@chakra-ui/react';

/**
 * DateSelector component for selecting date ranges
 * Supports daily, weekly, and monthly selection modes
 */
const DateSelector = ({ 
  mode = 'daily', // 'daily', 'weekly', 'monthly'
  date,
  startDate, 
  endDate,
  week,
  month,
  year,
  onChange,
  onSubmit
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Generate weeks for the current year with date ranges
  const getWeeksInYear = (year) => {
    const weeks = [];
    const currentYear = parseInt(year) || new Date().getFullYear();
    
    // Helper function to get the start date of a week (Monday)
    const getDateOfWeek = (year, week) => {
      const jan4 = new Date(year, 0, 4);
      const jan4Day = jan4.getDay() || 7;
      const week1Monday = new Date(jan4);
      week1Monday.setDate(jan4.getDate() - jan4Day + 1);
      const weekStart = new Date(week1Monday);
      weekStart.setDate(week1Monday.getDate() + 7 * (week - 1));
      return weekStart;
    };

    // Helper function to format date as MM-DD
    const formatDate = (date) => {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${month}-${day}`;
    };

    // Generate weeks 1-52 (most years have 52 weeks)
    for (let i = 1; i <= 52; i++) {
      try {
        const startDate = getDateOfWeek(currentYear, i);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        
        weeks.push({
          value: `${currentYear}-W${i.toString().padStart(2, '0')}`,
          label: `Week ${i} (${formatDate(startDate)} to ${formatDate(endDate)})`
        });
      } catch (error) {
        console.error(`Error generating week ${i}:`, error);
      }
    }
    
    // Try to add week 53 if it exists for this year
    try {
      const week53Start = getDateOfWeek(currentYear, 53);
      if (week53Start.getFullYear() === currentYear) {
        const week53End = new Date(week53Start);
        week53End.setDate(week53End.getDate() + 6);
        weeks.push({
          value: `${currentYear}-W53`,
          label: `Week 53 (${formatDate(week53Start)} to ${formatDate(week53End)})`
        });
      }
    } catch (error) {
      // Week 53 doesn't exist for this year, which is fine
    }
    
    return weeks;
  };

  // Generate array of months
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Generate array of years (5 years back, current year, 5 years ahead)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
      years.push(y.toString());
    }
    return years;
  };
  
  const years = generateYearOptions();
  const weeks = getWeeksInYear(year || new Date().getFullYear());
  
  // Debug: Log the weeks array
  console.log("Generated weeks for year", year || new Date().getFullYear(), ":", weeks.length, "weeks");
  if (weeks.length === 0) {
    console.error("No weeks generated!");
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  };

  const renderDateSelector = () => {
    switch (mode) {
      case 'daily':
        return (
          <FormControl>
            <FormLabel>Select Date</FormLabel>
            <Input
              type="date"
              value={date}
              onChange={(e) => onChange({ date: e.target.value })}
            />
          </FormControl>
        );
      
      case 'weekly':
        return (
          <>
            <FormControl>
              <FormLabel>Select Year</FormLabel>
              <Select
                value={year || new Date().getFullYear().toString()}
                onChange={(e) => onChange({ year: e.target.value })}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Select Week</FormLabel>
              <Select
                value={week}
                onChange={(e) => onChange({ week: e.target.value })}
              >
                {weeks.length > 0 ? weeks.map(weekItem => (
                  <option key={weekItem.value} value={weekItem.value}>
                    {weekItem.label}
                  </option>
                )) : (
                  <option value="">No weeks available</option>
                )}
              </Select>
            </FormControl>
          </>
        );
      
      case 'monthly':
        return (
          <>
            <FormControl>
              <FormLabel>Select Year</FormLabel>
              <Select
                value={year || new Date().getFullYear().toString()}
                onChange={(e) => onChange({ year: e.target.value })}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Select Month</FormLabel>
              <Select
                value={month}
                onChange={(e) => onChange({ month: e.target.value })}
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>
            </FormControl>
          </>
        );
      
      case 'yearly':
        return (
          <FormControl>
            <FormLabel>Select Year</FormLabel>
            <Select
              value={year || new Date().getFullYear().toString()}
              onChange={(e) => onChange({ year: e.target.value })}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'range':
        return (
          <>
            <FormControl>
              <FormLabel>Start Date</FormLabel>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onChange({ startDate: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel>End Date</FormLabel>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onChange({ endDate: e.target.value })}
              />
            </FormControl>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Box 
      as="form" 
      onSubmit={handleSubmit}
      bg={bgColor} 
      p={4} 
      borderRadius="md" 
      borderWidth="1px"
      borderColor={'transparent'}
      shadow="sm"
    >
      <HStack spacing={4} alignItems="flex-end">
        {renderDateSelector()}
        {onSubmit && (
          <Button 
            type="submit"
            colorScheme="blue"
            mt={4}
          >
            Apply
          </Button>
        )}
      </HStack>
    </Box>
  );
};

export default DateSelector;
