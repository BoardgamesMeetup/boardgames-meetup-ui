import axios from 'axios';
import { getSession } from '../cognito'; 

const GATEWAY_URL = 'http://localhost:9013';

async function authHeaders() {
  const session = await getSession();
  const token = session.getAccessToken().getJwtToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}


export async function createEvent(newEvent) {
  const config = await authHeaders();
  const response = await axios.post(`${GATEWAY_URL}/events/create`, newEvent, config);
  return response.data;
}


export async function searchEvents(filters) {
  const queryParams = new URLSearchParams(filters).toString();
  const config = await authHeaders();
  const response = await axios.get(`${GATEWAY_URL}/events/search?${queryParams}`, config);
  return response.data;
}
export async function searchEventsList(filters) {
    const queryParams = new URLSearchParams(filters).toString();
    const config = await authHeaders();
    const response = await axios.get(`${GATEWAY_URL}/events/search?${queryParams}`, config);
    return response.data;
  }
  export async function searchEventsForPlanner(filters) {
    const queryParams = new URLSearchParams(filters).toString();
    const config = await authHeaders();
    const response = await axios.get(`${GATEWAY_URL}/events/search?${queryParams}`, config);
    return response.data;
  }


export async function getPlannerOwnEvents() {
  const filters = {
    pageNumber: 0,
    pageSize: 10,
  };
  return searchEvents(filters);
}

export async function getPlayerOwnEvents() {
  const filters = {
    pageNumber: 0,
    pageSize: 10,
  };
  return searchEvents(filters);
}

export async function signUpForEvent(eventId, playerId) {
  const config = await authHeaders();
  const response = await axios.post(
    `${GATEWAY_URL}/events/player/${eventId}/signup/${playerId}`,
    null,
    config
  );
  return response.data;
}
