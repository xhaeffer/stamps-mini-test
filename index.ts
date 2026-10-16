const fizzBuzz = () => {
  const isPrime = (num: number) => {
    // 0 and 1 are not prime numbers
    if (num < 2) return false;

    // Check for divisors up to the square root of num
    for (let i = 2; i <= Math.sqrt(num); i++) {
      // Not a prime number
      if (num % i === 0) return false;
    }

    // No divisors found, so num is prime
    return true;
  };

  const numbers = Array.from({ length: 100 }, (_, i) => i + 1);
  const result = [...numbers]
    .reverse()
    .filter(num => !isPrime(num))
    .map(num => {
      if (num % 3 === 0 && num % 5 === 0) return "FooBar";
      if (num % 3 === 0) return "Foo";
      if (num % 5 === 0) return "Bar";
      return num;
    });

  console.log(result.join(", "));
}

const getWeather = async () => {
  const apiKey = process.env.OPENWEATHER_API_KEY // or insert your api key here
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is not set")
  }

  const cityName = "Jakarta"
  const countryCode = "ID"
  const unit = "metric"

  const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${cityName},${countryCode}&units=${unit}&appid=${apiKey}`)
  if (!res.ok) {
    throw new Error("Failed to fetch weather")
  }

  const data = await res.json() as {
    list: {
      // Forecast time as a Unix timestamp in seconds (UTC)
      dt: number,
      main: { temp: number }
    }[],
    // Offset from UTC in seconds (Jakarta: 25200 = +7h)
    city: { timezone: number }
  }

  // Today's local date as "YYYY-MM-DD"
  // Note: Timezone is in seconds, so we need to convert it into milliseconds by multiplying by 1000
  const today = new Date(Date.now() + data.city.timezone * 1000).toISOString().slice(0, 10)

  // The forecast comes in 3-hour steps, so pick one reading per local day:
  // today keeps its soonest reading, later days keep the one closest to midday
  const daily = new Map<string, { date: Date, hoursFromNoon: number, temp: number }>()

  for (const item of data.list) {
    // Get date and time in the local timezone
    const date = new Date((item.dt + data.city.timezone) * 1000)

    // Local date as "YYYY-MM-DD", used as the grouping key
    const day = date.toISOString().slice(0, 10)

    // Hours away from 12:00 (e.g. 13:00 -> 1, 10:00 -> 2). There is no exact 12:00 reading,
    // so the smallest value is the closest to midday
    const hoursFromNoon = Math.abs(date.getUTCHours() - 12)

    // Readings come in time order, so today's first reading is already the soonest one
    const current = daily.get(day)
    if (!current || (day !== today && hoursFromNoon < current.hoursFromNoon)) {
      daily.set(day, { date, hoursFromNoon, temp: item.main.temp })
    }
  }

  console.log(`Weather Forecast for ${cityName}:`)

  // Print one line per day, in date order.
  // The API forecasts the next 5 days counted from right now, so we usually get today plus 5 more days.
  // When run close to midnight, one of those days falls outside that range, so only 5 days are shown.
  for (const { date, temp } of daily.values()) {
    // timeZone "UTC" because the date is already shifted to local time
    const label = date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    })
    console.log(`${label}: ${temp.toFixed(2)}°C`)
  }
}

fizzBuzz()
getWeather()