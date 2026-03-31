import Testing
@testable import OpenClaw

struct GatewayAgentChannelTests {
    @Test func `should deliver blocks web chat`() {
        #expect(GatewayAgentChannel.webchat.shouldDeliver(true) == false)
        #expect(GatewayAgentChannel.webchat.shouldDeliver(false) == false)
    }

    @Test func `should deliver allows last only`() {
        #expect(GatewayAgentChannel.last.shouldDeliver(true) == true)
        #expect(GatewayAgentChannel.last.shouldDeliver(false) == false)
    }

    @Test func `init raw normalizes and falls back to last`() {
        #expect(GatewayAgentChannel(raw: nil) == .last)
        #expect(GatewayAgentChannel(raw: "  ") == .last)
        #expect(GatewayAgentChannel(raw: "WEBCHAT") == .webchat)
        #expect(GatewayAgentChannel(raw: "unknown") == .last)
    }
}
