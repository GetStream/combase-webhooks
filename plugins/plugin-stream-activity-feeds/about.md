## Stream Activity Feeds for Combase

Auto-generate Stream Feeds Activities for events happening in your combase organization.

```js
export const hello = () => "Hello, World!";
```

### Why?

With this plugin enabled, all events for your Combase app will be piped back into Stream activity feeds that are available in each detail screen.

#### How does it work?

Combase webhooke events are captured in realtime and the data is used to create realtime activity feeds that you can use to keep a pulse on everything under your organization.

**Feeds & Relationships**

- `user`: Every User that interacts with your organization will have a feed unqiue to them. This allows you to see all previous interactions with this user - if they previously spoke with a colleague, or some notes were added to their profile, you can see it all!
- `agent` Every agent also has a feed. As they perform actions like tagging tickets, opening new tickets, interacting with customers etc the feed will be updaed in realtime.
- `organization`: Your orgnanization has two top-level feeds. One is a flat feed that can be used as a realtime event ticker for all events. The organization feed follows all users, tickets and agents to collate a top-level realtime overview. However, his will likely get noisey - we also create an aggregated version of the same feed that will group similar activities by a parent entity. For Example, `2 Udpates to Luke's agent profile` or `5 tickets we're assigned recently` etc.
- `ticket`: Tickets also have a feed, to which agents can add activities to act as notes. You can even attach files pertaining to the ticket for safe keeping, or that other agents may find useful down the road.

### Good-to-knows

- All Combase Activities should have an `entity` property. The entity property is the name of the GQL type of the object property. I.e. if `activity.object` is a Ticket ID, `entity` should be `Ticket`. This allows GraphQL to automagically enrich the activities.
- All Combase Organizations have a Chat User. This can be used to send messages and activities as the "Organization Bot" - examples of actions performed by the bot are, assigning tickets, sending welcome messages, handling of unassigned tickets etc.
