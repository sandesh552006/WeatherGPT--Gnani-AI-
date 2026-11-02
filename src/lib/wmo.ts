export interface WmoInfo {
  description: string;
  icon: string;
  category: 'clear' | 'clouds' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm';
}

export function getWeatherCondition(code: number): WmoInfo {
  switch (code) {
    case 0:
      return { description: 'Clear sky', icon: '☀️', category: 'clear' };
    case 1:
      return { description: 'Mainly clear', icon: '🌤️', category: 'clear' };
    case 2:
      return { description: 'Partly cloudy', icon: '⛅', category: 'clouds' };
    case 3:
      return { description: 'Overcast', icon: '☁️', category: 'clouds' };
    case 45:
    case 48:
      return { description: 'Foggy', icon: '🌫️', category: 'fog' };
    case 51:
      return { description: 'Light drizzle', icon: '🌦️', category: 'drizzle' };
    case 53:
      return { description: 'Moderate drizzle', icon: '🌦️', category: 'drizzle' };
    case 55:
      return { description: 'Dense drizzle', icon: '🌧️', category: 'drizzle' };
    case 56:
    case 57:
      return { description: 'Freezing drizzle', icon: '🌨️', category: 'drizzle' };
    case 61:
      return { description: 'Slight rain', icon: '🌧️', category: 'rain' };
    case 63:
      return { description: 'Moderate rain', icon: '🌧️', category: 'rain' };
    case 65:
      return { description: 'Heavy rain', icon: '🌧️', category: 'rain' };
    case 66:
    case 67:
      return { description: 'Freezing rain', icon: '🌨️', category: 'rain' };
    case 71:
      return { description: 'Slight snow fall', icon: '❄️', category: 'snow' };
    case 73:
      return { description: 'Moderate snow fall', icon: '❄️', category: 'snow' };
    case 75:
      return { description: 'Heavy snow fall', icon: '❄️', category: 'snow' };
    case 77:
      return { description: 'Snow grains', icon: '❄️', category: 'snow' };
    case 80:
      return { description: 'Slight rain showers', icon: '🌦️', category: 'rain' };
    case 81:
      return { description: 'Moderate rain showers', icon: '🌧️', category: 'rain' };
    case 82:
      return { description: 'Violent rain showers', icon: '⛈️', category: 'rain' };
    case 85:
      return { description: 'Slight snow showers', icon: '🌨️', category: 'snow' };
    case 86:
      return { description: 'Heavy snow showers', icon: '🌨️', category: 'snow' };
    case 95:
      return { description: 'Thunderstorm', icon: '⛈️', category: 'thunderstorm' };
    case 96:
    case 99:
      return { description: 'Thunderstorm with hail', icon: '⛈️', category: 'thunderstorm' };
    default:
      return { description: 'Partly cloudy', icon: '⛅', category: 'clouds' };
  }
}
