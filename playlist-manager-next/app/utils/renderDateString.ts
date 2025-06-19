const renderDateString = (dateString: string): string =>
  Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long'
  }).format(new Date(dateString));

export default renderDateString;
