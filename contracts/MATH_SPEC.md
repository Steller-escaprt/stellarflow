# 📐 StellarFlow Mathematical Specification & Invariant Proofs

## 1. Linear Streaming & Continuous Vesting Formulation

StellarFlow executes continuous, second-by-second token distribution using deterministic integer arithmetic on the Soroban smart contract host environment.

Let:
- $A_{\text{total}} \in \mathbb{N}$: Total tokens deposited into escrow (scaled to 7 decimals, represented as `i128`).
- $T_{\text{start}} \in \mathbb{N}$: Unix timestamp (seconds) when streaming commences.
- $D \in \mathbb{N}^+$: Total duration of the stream in seconds ($D = T_{\text{end}} - T_{\text{start}}$).
- $C \in [0, D]$: Cliff duration in seconds ($T_{\text{cliff}} = T_{\text{start}} + C$).
- $t \in \mathbb{N}$: Current ledger timestamp (`env.ledger().timestamp()`).
- $A_{\text{claimed}} \in [0, A_{\text{total}}]$: Cumulative tokens already withdrawn by the recipient.

### 1.1 Vested Amount Function $V(t)$

The vested value function $V(t)$ is monotonically non-decreasing and bounded by $[0, A_{\text{total}}]$:

$$
V(t) = \begin{cases} 
0 & \text{if } t < T_{\text{cliff}} \\
\left\lfloor \frac{A_{\text{total}} \times (t - T_{\text{start}})}{D} \right\rfloor & \text{if } T_{\text{cliff}} \le t < T_{\text{start}} + D \\
A_{\text{total}} & \text{if } t \ge T_{\text{start}} + D 
\end{cases}
$$

### 1.2 Claimable Amount Function $\Delta_{\text{claim}}(t)$

At any time $t \ge T_{\text{cliff}}$, the net tokens available for the recipient to withdraw is:

$$
\Delta_{\text{claim}}(t) = V(t) - A_{\text{claimed}}
$$

Subject to the contract assertion:
$$
0 \le \Delta_{\text{claim}}(t) \le A_{\text{total}} - A_{\text{claimed}}
$$

---

## 2. Cancellation & Liquidity Refund Invariants

When a stream is canceled by an authorized party (either sender or recipient, if configured as revocable) at timestamp $t_{\text{cancel}}$:

1. **Recipient Entitlement:** The recipient receives all newly vested, unclaimed tokens up to $t_{\text{cancel}}$:
   $$R_{\text{recipient}} = V(t_{\text{cancel}}) - A_{\text{claimed}}$$

2. **Sender Refund:** The unvested balance is atomically returned to the sender:
   $$R_{\text{sender}} = A_{\text{total}} - V(t_{\text{cancel}})$$

### 2.1 Theorem 1: Conservation of Value
$$\forall t \in \mathbb{N}, \quad A_{\text{claimed}} + R_{\text{recipient}} + R_{\text{sender}} \equiv A_{\text{total}}$$

**Proof:**
$$\begin{aligned}
A_{\text{claimed}} + R_{\text{recipient}} + R_{\text{sender}} &= A_{\text{claimed}} + (V(t) - A_{\text{claimed}}) + (A_{\text{total}} - V(t)) \\
&= V(t) + A_{\text{total}} - V(t) \\
&= A_{\text{total}} \quad \blacksquare
\end{aligned}$$

No tokens can be created or destroyed within the contract state.

---

## 3. Fixed-Point Arithmetic & Truncation Guard

### 3.1 Avoiding Integer Division Underflow
In 128-bit integer arithmetic, dividing before multiplying causes devastating precision loss:
$$\left( \frac{A_{\text{total}}}{D} \right) \times (t - T_{\text{start}}) \quad \text{[INCORRECT: Truncates per-second rate to 0 for small deposits]}$$

StellarFlow strictly multiplies before dividing:
$$\left\lfloor \frac{A_{\text{total}} \times (t - T_{\text{start}})}{D} \right\rfloor \quad \text{[CORRECT: Preserves sub-cent precision]}$$

### 3.2 Overflow Boundary Analysis
- Maximum Stellar token supply: $\approx 5 \times 10^{10}$ XLM $= 5 \times 10^{17}$ Stroops.
- Maximum duration (10 years): $\approx 3.15 \times 10^8$ seconds.
- Intermediate multiplication product:
  $$P_{\text{max}} = 5 \times 10^{17} \times 3.15 \times 10^8 \approx 1.575 \times 10^{26}$$
- Maximum positive value of signed `i128`:
  $$2^{127} - 1 \approx 1.701 \times 10^{38}$$

Since $1.575 \times 10^{26} \ll 1.701 \times 10^{38}$, arithmetic overflow is **mathematically impossible** within standard protocol parameters.

---

## 4. Formal Invariant Summary for Auditors

| Invariant ID | Formulation | Enforcement Point |
| :--- | :--- | :--- |
| **INV-01 (Boundedness)** | $0 \le V(t) \le A_{\text{total}}$ | `calculate_vested()` |
| **INV-02 (Monotonicity)** | $\forall t_1 \le t_2, V(t_1) \le V(t_2)$ | Linear time progression |
| **INV-03 (Cliff Gate)** | $t < T_{\text{cliff}} \implies V(t) = 0$ | Pre-cliff validation guard |
| **INV-04 (Terminal Equality)** | $t \ge T_{\text{start}} + D \implies V(t) = A_{\text{total}}$ | Post-duration clamp |
| **INV-05 (Conservation)** | $A_{\text{claimed}} + \text{RemainingEscrow} = A_{\text{total}}$ | Storage state mutation |
