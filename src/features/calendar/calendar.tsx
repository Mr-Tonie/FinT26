import { useState, useEffect } from "react";
import { Layout } from "@/shared/components/Layout";
import { transactionsAPI } from "@/shared/services/api";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  isBefore,
  differenceInDays,
  isPast
} from "date-fns";
import type {
  CurrencyCode,
  TransactionCategory,
  PaymentMethod
} from "@/shared/types/financial.types";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  color: string;
  financialType?: "income" | "expense" | "none";
  expectedAmount?: number;
  currency?: CurrencyCode;
  category?: TransactionCategory;
  paymentMethod?: PaymentMethod;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  morningReminderShown?: boolean;
  eveningReminderShown?: boolean;
}

const EVENT_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Red", value: "#ef4444" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Orange", value: "#f59e0b" },
  { name: "Pink", value: "#ec4899" }
];

export function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<CalendarEvent | null>(
    null
  );
  const [pendingReminders, setPendingReminders] = useState<CalendarEvent[]>([]);

  const [eventForm, setEventForm] = useState({
    title: "",
    time: "",
    description: "",
    color: EVENT_COLORS[0].value,
    financialType: "none" as "income" | "expense" | "none",
    expectedAmount: "",
    currency: "USD" as CurrencyCode,
    category: "expense_other" as TransactionCategory,
    paymentMethod: "cash" as PaymentMethod
  });

  // Load events from localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem("calendar_events");
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem("calendar_events", JSON.stringify(events));
  }, [events]);

  // Check for reminders every minute
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const today = format(now, "yyyy-MM-dd");
      const currentHour = now.getHours();

      events.forEach((event) => {
        if (event.date === today && event.status === "pending") {
          // Morning reminder (8 AM - 9 AM)
          if (currentHour === 8 && !event.morningReminderShown) {
            setPendingReminders((prev) => {
              if (!prev.find((e) => e.id === event.id)) {
                return [...prev, event];
              }
              return prev;
            });
            setEvents((prev) =>
              prev.map((e) =>
                e.id === event.id ? { ...e, morningReminderShown: true } : e
              )
            );
          }

          // Evening reminder (6 PM - 7 PM)
          if (currentHour === 18 && !event.eveningReminderShown) {
            if (event.financialType !== "none") {
              setCurrentReminder(event);
              setShowConfirmationModal(true);
              setEvents((prev) =>
                prev.map((e) =>
                  e.id === event.id ? { ...e, eveningReminderShown: true } : e
                )
              );
            }
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [events]);

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return events.filter((event) => event.date === dateStr);
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return events
      .filter((event) => {
        const eventDate = parseISO(event.date);
        return !isBefore(eventDate, today) || isSameDay(eventDate, today);
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  };

  const getDaysUntil = (dateStr: string) => {
    const eventDate = parseISO(dateStr);
    const today = new Date();
    const days = differenceInDays(eventDate, today);

    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days < 0) return "Past";
    return `In ${days} days`;
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowEventModal(true);
  };

  const handleCreateEvent = () => {
    if (!selectedDate || !eventForm.title) return;

    const newEvent: CalendarEvent = {
      id: `event_${Date.now()}`,
      title: eventForm.title,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: eventForm.time || undefined,
      description: eventForm.description || undefined,
      color: eventForm.color,
      financialType: eventForm.financialType,
      expectedAmount: eventForm.expectedAmount
        ? parseFloat(eventForm.expectedAmount)
        : undefined,
      currency: eventForm.currency,
      category: eventForm.category,
      paymentMethod: eventForm.paymentMethod,
      status: "pending"
    };

    setEvents([...events, newEvent]);
    setShowEventModal(false);
    setEventForm({
      title: "",
      time: "",
      description: "",
      color: EVENT_COLORS[0].value,
      financialType: "none",
      expectedAmount: "",
      currency: "USD",
      category: "expense_other",
      paymentMethod: "cash"
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter((e) => e.id !== eventId));
  };

  const handleMorningConfirm = (event: CalendarEvent, stillGoing: boolean) => {
    if (stillGoing) {
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, status: "confirmed" } : e))
      );
    } else {
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, status: "cancelled" } : e))
      );
    }
    setPendingReminders((prev) => prev.filter((e) => e.id !== event.id));
  };

  const handleEveningConfirmation = async (
    actualAmount: number,
    didHappen: boolean
  ) => {
    if (!currentReminder) return;

    if (didHappen && currentReminder.financialType !== "none") {
      // Create transaction
      const category =
        currentReminder.financialType === "income"
          ? ("income_other" as TransactionCategory)
          : currentReminder.category!;

      const result = await transactionsAPI.create({
        date: currentReminder.date,
        description: currentReminder.title,
        amount: actualAmount,
        currency: currentReminder.currency!,
        category,
        payment_method: currentReminder.paymentMethod!,
        notes: `Auto-added from calendar event: ${currentReminder.description || ""}`
      });

      if (result.data) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === currentReminder.id ? { ...e, status: "completed" } : e
          )
        );
        alert("✓ Transaction added successfully!");
      }
    } else {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === currentReminder.id ? { ...e, status: "cancelled" } : e
        )
      );
    }

    setShowConfirmationModal(false);
    setCurrentReminder(null);
  };

  const upcomingEvents = getUpcomingEvents();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Pending Reminders Banner */}
        {pendingReminders.length > 0 && (
          <div className="bg-warning/10 border-2 border-warning rounded-lg p-4">
            <h3 className="text-lg font-semibold text-warning mb-3 flex items-center">
              <span className="text-2xl mr-2">⚠️</span>
              Pending Confirmations
            </h3>
            <div className="space-y-2">
              {pendingReminders.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-lg p-3 border border-warning/30"
                >
                  <p className="font-medium text-neutral-900 mb-2">
                    {event.title} - Today{event.time && ` at ${event.time}`}
                  </p>
                  <p className="text-sm text-neutral-600 mb-3">
                    Are you still planning to go ahead with this event?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleMorningConfirm(event, true)}
                      className="btn btn-primary btn-sm"
                    >
                      Yes, Still Going
                    </button>
                    <button
                      onClick={() => handleMorningConfirm(event, false)}
                      className="btn btn-outline btn-sm"
                    >
                      No, Cancel It
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900">Calendar</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Schedule events and track financial activities
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedDate(new Date());
              setShowEventModal(true);
            }}
            className="btn btn-primary"
          >
            + New Event
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Calendar */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-neutral-900">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleToday}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200"
                >
                  Today
                </button>
                <button
                  onClick={handlePrevMonth}
                  className="p-2 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200"
                >
                  ←
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200"
                >
                  →
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-neutral-600 py-2"
                >
                  {day}
                </div>
              ))}

              {days.map((day, idx) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isDayToday = isToday(day);

                return (
                  <div
                    key={idx}
                    onClick={() => handleDateClick(day)}
                    className={`
                      min-h-24 p-2 border rounded-lg cursor-pointer transition-all
                      ${isCurrentMonth ? "bg-white" : "bg-neutral-50"}
                      ${isDayToday ? "border-primary-600 border-2" : "border-neutral-200"}
                      hover:shadow-md hover:border-primary-400
                    `}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${!isCurrentMonth ? "text-neutral-400" : "text-neutral-900"} ${isDayToday ? "text-primary-600 font-bold" : ""}`}
                    >
                      {format(day, "d")}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs px-1 py-0.5 rounded truncate"
                          style={{
                            backgroundColor: event.color + "20",
                            color: event.color,
                            borderLeft: `3px solid ${event.color}`
                          }}
                          title={event.title}
                        >
                          {event.financialType !== "none" && (
                            <span className="mr-1">
                              {event.financialType === "income" ? "💰" : "💸"}
                            </span>
                          )}
                          {event.time && `${event.time} `}
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-neutral-500 px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="card">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Upcoming Events
            </h3>

            {upcomingEvents.length === 0 ? (
              <p className="text-center py-8 text-neutral-500">
                No upcoming events
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const daysUntil = getDaysUntil(event.date);
                  return (
                    <div
                      key={event.id}
                      className="p-3 border rounded-lg hover:bg-neutral-50 transition-colors"
                      style={{
                        borderLeftColor: event.color,
                        borderLeftWidth: 4
                      }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-neutral-900 flex items-center">
                          {event.financialType !== "none" && (
                            <span className="mr-1">
                              {event.financialType === "income" ? "💰" : "💸"}
                            </span>
                          )}
                          {event.title}
                        </h4>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-danger hover:text-red-700 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-sm text-neutral-600">
                        {format(parseISO(event.date), "MMM d, yyyy")}
                        {event.time && ` at ${event.time}`}
                      </p>
                      {event.expectedAmount && (
                        <p
                          className="text-sm font-semibold mt-1"
                          style={{ color: event.color }}
                        >
                          {event.financialType === "income" ? "+" : "-"}$
                          {event.expectedAmount}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-xs text-neutral-500 mt-1">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p
                          className="text-xs font-semibold"
                          style={{ color: event.color }}
                        >
                          {daysUntil}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            event.status === "completed"
                              ? "bg-success/20 text-success"
                              : event.status === "confirmed"
                                ? "bg-primary/20 text-primary-600"
                                : event.status === "cancelled"
                                  ? "bg-neutral-200 text-neutral-600"
                                  : "bg-warning/20 text-warning"
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Event Creation Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-neutral-900">
                  New Event
                </h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="text"
                    value={
                      selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""
                    }
                    className="input"
                    disabled
                  />
                </div>

                <div>
                  <label className="label">Event Title*</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, title: e.target.value })
                    }
                    className="input"
                    placeholder="e.g., Team Meeting"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label">Time (Optional)</label>
                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, time: e.target.value })
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Description (Optional)</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        description: e.target.value
                      })
                    }
                    className="input"
                    rows={3}
                    placeholder="Add notes..."
                  />
                </div>

                <div>
                  <label className="label">Financial Type</label>
                  <select
                    value={eventForm.financialType}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        financialType: e.target.value as any
                      })
                    }
                    className="input"
                  >
                    <option value="none">No Financial Impact</option>
                    <option value="expense"> Expense (Money Out)</option>
                    <option value="income"> Income (Money In)</option>
                  </select>
                </div>

                {eventForm.financialType !== "none" && (
                  <>
                    <div>
                      <label className="label">Expected Amount*</label>
                      <input
                        type="number"
                        value={eventForm.expectedAmount}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            expectedAmount: e.target.value
                          })
                        }
                        className="input"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="label">Currency</label>
                      <select
                        value={eventForm.currency}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            currency: e.target.value as CurrencyCode
                          })
                        }
                        className="input"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="ZWL">ZWL</option>
                        <option value="ZIG">ZIG</option>
                      </select>
                    </div>

                    {eventForm.financialType === "expense" && (
                      <>
                        <div>
                          <label className="label">Category</label>
                          <select
                            value={eventForm.category}
                            onChange={(e) =>
                              setEventForm({
                                ...eventForm,
                                category: e.target.value as TransactionCategory
                              })
                            }
                            className="input"
                          >
                            <option value="expense_food">
                              Food & Groceries
                            </option>
                            <option value="expense_transport">Transport</option>
                            <option value="expense_housing">
                              Housing & Rent
                            </option>
                            <option value="expense_utilities">Utilities</option>
                            <option value="expense_healthcare">
                              Healthcare
                            </option>
                            <option value="expense_education">Education</option>
                            <option value="expense_entertainment">
                              Entertainment
                            </option>
                            <option value="expense_other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="label">Payment Method</label>
                          <select
                            value={eventForm.paymentMethod}
                            onChange={(e) =>
                              setEventForm({
                                ...eventForm,
                                paymentMethod: e.target.value as PaymentMethod
                              })
                            }
                            className="input"
                          >
                            <option value="cash">Cash</option>
                            <option value="ecocash">EcoCash</option>
                            <option value="onamii">Onamii</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="card">Card</option>
                          </select>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div>
                  <label className="label">Color</label>
                  <div className="flex space-x-2">
                    {EVENT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() =>
                          setEventForm({ ...eventForm, color: color.value })
                        }
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          eventForm.color === color.value
                            ? "border-neutral-900 scale-110"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCreateEvent}
                  disabled={
                    !eventForm.title ||
                    (eventForm.financialType !== "none" &&
                      !eventForm.expectedAmount)
                  }
                  className="btn btn-primary flex-1"
                >
                  Create Event
                </button>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Evening Confirmation Modal */}
        {showConfirmationModal && currentReminder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                Event Confirmation
              </h3>
              <p className="text-neutral-700 mb-4">
                Did you complete the event:{" "}
                <strong>{currentReminder.title}</strong>?
              </p>
              {currentReminder.expectedAmount && (
                <p className="text-sm text-neutral-600 mb-4">
                  Expected amount:{" "}
                  <strong>${currentReminder.expectedAmount}</strong>
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="label">Actual Amount</label>
                  <input
                    type="number"
                    id="actualAmount"
                    className="input"
                    placeholder="Enter actual amount"
                    step="0.01"
                    min="0"
                    defaultValue={currentReminder.expectedAmount}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const input = document.getElementById(
                        "actualAmount"
                      ) as HTMLInputElement;
                      const amount = parseFloat(input.value || "0");
                      handleEveningConfirmation(amount, true);
                    }}
                    className="btn btn-primary flex-1"
                  >
                    Yes, Add to Transactions
                  </button>
                  <button
                    onClick={() => handleEveningConfirmation(0, false)}
                    className="btn btn-outline"
                  >
                    No, Didn't Happen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
