import { Event } from "@/lib/types"
import EventCard from "./EventCard"

type Props = {
  events: Event[]
}

export default function EventList({ events }: Props) {
  if (events.length === 0) {
    return <p>No hay eventos</p>
  }

  return (
    <ul className="space-y-4">
      {events.map(event => (
        <li key={event.id}>
          <EventCard event={event} />
        </li>
      ))}
    </ul>
  )
}
